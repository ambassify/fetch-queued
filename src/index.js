const https = require('https');
const http = require('http');

const FetchQueue = require('./core');

function createAgent(protocol, size) {
    return new protocol.Agent({
        keepAlive: true,
        maxSockets: Math.ceil(size * 1.3),
        maxFreeSockets: Math.ceil(size * 1.1)
    });
}

module.exports =
class NodeFetchQueue extends FetchQueue {

    resize(size) {
        this._httpsAgent = createAgent(https, size);
        this._httpAgent = createAgent(http, size);

        return super.resize(size);
    }

    fetch(input, init) {
        let agent = this._httpAgent;
        if (input.substr(0, 5) == 'https')
            agent = this._httpsAgent;

        init = init || {};
        init.agent = init.agent || agent;

        return super.fetch(input, init);
    }

}
