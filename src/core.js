const _fetch = require('@ambassify/fetch');

module.exports =
class FetchQueue {

    constructor(size, options = {}) {
        this._queue = [];
        this._pending = 0;
        this._fetch = options.fetch || _fetch;

        this.fetch = this.fetch.bind(this);
        this._finish = this._finish.bind(this);
        this._error = this._error.bind(this);

        this.resize(size);
    }

    resize(size) {
        this.size = size;
        this._size = size; // @deprecated

        // Trigger queued items if queue became bigger
        this._check();
    }

    fetch(input, init) {
        init = init || {};

        return new Promise(resolve => this._push(resolve))
            .then(() => this._fetch(input, init))
            .then(this._finish)
            .catch(this._error);
    }

    _check() {
        if (this._pending >= this.size)
            return;

        if (this._queue.length < 1)
            return;

        this._pending++;
        const start = this._queue.shift();
        start();

        // Flush all queued items until queue is full
        this._check();
    }

    _push(start) {
        this._queue.push(start);
        this._check();
    }

    _pop() {
        this._pending--;

        if (this._pending < 0)
            throw new Error('Pop called more than there were pending fetches');

        this._check();
    }

    _finish(r) {
        this._pop();
        return r;
    }

    _error(err) {
        this._pop();
        throw err;
    }

}
