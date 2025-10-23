/**
 * node-redis has serious performance issues when working with typescript
 * so do not use the "RedisClientType" type.
 */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { SystemLogger } from 'src/common/logging/system.logger';
import { createClient } from '@redis/client';

export class RedisConnection {
    private readonly subscribers = new Array<any>();
    private readonly _client: any;

    constructor(
        private readonly redisUri: string,
        private readonly context: string,
    ) {
        this._client = createClient({
            url: redisUri,
        });
        this.configEvents();
    }

    get client() {
        return this._client;
    }

    private onError = (err: string) => {
        SystemLogger.getInstance().error(`${err}`, this.context);
    };

    private onReconnecting = () => {
        SystemLogger.getInstance().warn(`Reconnecting...`, this.context);
    };

    configEvents() {
        this._client.on('error', this.onError);
        this._client.on('reconnecting', this.onReconnecting);
    }

    async addSubscriber(
        channel: string,
        listener: (payload: string) => Promise<void>,
    ) {
        const subscriber = this._client.duplicate();
        subscriber.subscribe(channel, listener);
        await subscriber.connect();
        this.subscribers.push(subscriber);
    }

    async connect() {
        await this._client.connect();
    }

    async disconnect() {
        await Promise.all(this.subscribers.map((sub) => sub.disconnect()));
        await this._client.disconnect();
    }
}
