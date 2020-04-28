'use strict';

/* globals describe, before, afterEach, it */

const nock = require('nock');
const assert = require('assert');

const assertTime = (duration) => {
    const start = Date.now();
    return function() {
        const len = Date.now() - start;
        assert(len >= duration, `Only ${len}ms elapsed, expected ${duration}ms`);
        assert(len < duration + 25, `${len}ms elapsed, expected ${duration}ms`);

        return len;
    };
}

describe('queued', () => {

    const FetchQueued = require('..');

    before(() => {
        nock.cleanAll();
    })

    afterEach(() => {
        nock.cleanAll();
    });

    it('should run concurrent', async () => {
        nock('https://test.ambassify.eu')
            .get('/hello-world')
            .delay(500)
            .times(5)
            .reply(200, { ok: true });

        const queue = new FetchQueued(5);
        const end = assertTime(500);

        const url = 'https://test.ambassify.eu/hello-world';
        await Promise.all([
            queue.fetch(url),
            queue.fetch(url),
            queue.fetch(url),
            queue.fetch(url),
            queue.fetch(url),
        ]);

        end();
    })

    it('should queue fetch requests', async () => {
        nock('https://test.ambassify.eu')
            .get('/hello-world')
            .delay(500)
            .times(5)
            .reply(200, { ok: true });

        const queue = new FetchQueued(2);
        const end = assertTime(1500);

        const url = 'https://test.ambassify.eu/hello-world';
        await Promise.all([
            queue.fetch(url),
            queue.fetch(url),
            queue.fetch(url),
            queue.fetch(url),
            queue.fetch(url),
        ]);

        end();
    })

    it('should trigger queue on resize', async () => {
        nock('https://test.ambassify.eu')
            .get('/hello-world')
            .delay(500)
            .times(5)
            .reply(200, { ok: true });

        const queue = new FetchQueued(2);
        const end = assertTime(500);

        const url = 'https://test.ambassify.eu/hello-world';
        const p = Promise.all([
            queue.fetch(url),
            queue.fetch(url),
            queue.fetch(url),
            queue.fetch(url),
            queue.fetch(url),
        ]);

        queue.resize(5);

        await p;

        end();
    })

});
