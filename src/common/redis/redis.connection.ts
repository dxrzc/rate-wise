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
import { IRedisConnectionOptions } from '../interfaces/redis/redis.connection.options.interface';
import { redisReconnectStrategy } from '../functions/redis/redis-reconnect-strategy';
import { runSettledOrThrow } from '../utils/run-settled-or-throw.util';

export class RedisConnection {
    private readonly subscribers = new Array<any>();
    private readonly _client: any;

    constructor(private readonly options: IRedisConnectionOptions) {
        this._client = createClient({
            url: options.redisUri,
            disableOfflineQueue: options.disableOfflineQueue,
            socket: { reconnectStrategy: redisReconnectStrategy },
        });
        this.configEvents();
    }

    get client() {
        return this._client;
    }

    configEvents(client = this._client) {
        client.on('error', (err: Error) => {
            logRedisClientError(err, this.options.context);
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
            await runSettledOrThrow(this.subscribers.map(async (sub) => await sub.disconnect()));
            await this._client.disconnect();
        }
    }
}
