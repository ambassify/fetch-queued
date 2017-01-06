const _fetch = require('node-fetch');
const https = require('https');
const http = require('http');

function createAgent(protocol, size) {
    return new protocol.Agent({
        keepAlive: true,
        maxSockets: Math.ceil(size * 1.3),
        maxFreeSockets: Math.ceil(size * 1.1)
    });
}

module.exports =
class FetchQueue {

    constructor(size) {
        this._queue = [];
        this._pending = 0;
        this._size = size;
        this._httpsAgent = createAgent(https, this._size);
        this._httpAgent = createAgent(http, this._size);

        this.fetch = this.fetch.bind(this);
        this._finish = this._finish.bind(this);
        this._error = this._error.bind(this);
    }

    fetch(input, init) {
        let agent = this._httpAgent;
        if (input.substr(0, 5) == 'https')
            agent = this._httpsAgent;

        init = init || {};
        init.agent = init.agent || agent;

        return new Promise(resolve => this._push(resolve))
            .then(() => _fetch(input, init))
            .then(this._finish)
            .catch(this._error);
    }

    _check() {
        if (this._pending >= this._size)
            return;

        if (this._queue.length < 1)
            return;

        this._pending++;
        const start = this._queue.shift();
        start();
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
