/**
 * node-redis has serious performance issues when working with typescript
 * so do not use the "RedisClientType" type.
 */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { createClient } from '@redis/client';
import { logRedisClientError } from './log-redis.client-error';

// Maximum reconnection delay in milliseconds (30 seconds)
const MAX_RECONNECT_DELAY = 30000;

export class RedisConnection {
    private readonly subscribers = new Array<any>();
    private readonly _client: any;

    constructor(
        private readonly redisUri: string,
        private readonly context: string,
    ) {
        this._client = createClient({
            url: redisUri,
            socket: {
                reconnectStrategy: (retries) => {
                    // Calculate delay with exponential backoff: 2^retries * 50ms
                    const exponentialDelay = Math.pow(2, retries) * 50;
                    // Cap the delay at MAX_RECONNECT_DELAY
                    const cappedDelay = Math.min(exponentialDelay, MAX_RECONNECT_DELAY);
                    // Add jitter (random value between 0-1000ms) to prevent thundering herd
                    const jitter = Math.floor(Math.random() * 1000);
                    return cappedDelay + jitter;
                },
            },
        });
        this.configEvents();
    }

    get client() {
        return this._client;
    }

    configEvents(client = this._client) {
        client.on('error', (err: Error) => {
            logRedisClientError(err, this.context);
        });
    }

    async addSubscriber(channel: string, listener: (payload: string) => Promise<void>) {
        const subscriber = this._client.duplicate();
        subscriber.subscribe(channel, listener);
        this.configEvents(subscriber);
        await subscriber.connect();
        this.subscribers.push(subscriber);
    }

    async connect() {
        await this._client.connect();
    }

    async disconnect() {
        if (this._client.isOpen) {
            await Promise.all(this.subscribers.map((sub) => sub.disconnect()));
            await this._client.disconnect();
        }
    }
}
