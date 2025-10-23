/**
 * node-redis has serious performance issues when working with typescript
 * so do not use the "RedisClientType" type.
 */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */

import { SystemLogger } from 'src/common/logging/system.logger';
import { RedisType } from '../enum/redis-type.enum';

export class RedisConnection {
    private subscribers = new Array<any>();

    constructor(
        private readonly client: any,
        private readonly context: RedisType,
    ) {
        this.configEvents();
    }

    private onError = (err: string) => {
        SystemLogger.getInstance().error(`${err}`, this.context);
    };

    private onReconnecting = () => {
        SystemLogger.getInstance().warn(`Reconnecting...`, this.context);
    };

    configEvents() {
        this.client.on('error', this.onError);
        this.client.on('reconnecting', this.onReconnecting);
    }

    async addSubscriber(
        channel: string,
        listener: (payload: string) => Promise<void>,
    ) {
        const subscriber = this.client.duplicate();
        subscriber.subscribe(channel, listener);
        await subscriber.connect();
        this.subscribers.push(subscriber);
    }

    async connect() {
        await this.client.connect();
    }

    async disconnect() {
        await Promise.all(this.subscribers.map((sub) => sub.disconnect()));
        await this.client.disconnect();
    }
}
