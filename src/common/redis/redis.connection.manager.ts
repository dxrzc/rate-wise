/**
 * node-redis has serious performance issues when working with typescript
 * so do not use the "RedisClientType" type.
 */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { IRedisClient } from '../interfaces/redis/redis-client.interface';
import { createClient } from '@redis/client';

export class RedisConnectionManager {
    private redis: any;
    private subscriber: any;

    constructor(private readonly redisOpts: IRedisClient) {}

    get client() {
        return this.redis;
    }

    async connect(): Promise<void> {
        this.redis = await createClient({ url: this.redisOpts.uri })
            .on('error', (err) => console.log('Redis Client Error', err))
            .connect();
        if (this.redisOpts.pubSub)
            this.subscriber = await this.configureSubscriber();
    }

    async configureSubscriber(): Promise<unknown> {
        const pubSub = this.redisOpts.pubSub;
        if (!pubSub) throw new Error('Pub/Sub not enabled');
        const subscriber = this.redis.duplicate();
        await (this.redis.configSet(
            'notify-keyspace-events',
            pubSub.notifyKeyspaceEvents,
        ),
        await subscriber.connect());
        await Promise.all(
            Object.entries(pubSub.subscriptions).map(([channel, handler]) => {
                subscriber.subscribe(channel, (key: string) =>
                    handler(this.client, key),
                );
            }),
        );
        return subscriber;
    }

    async disconnect() {
        await this.redis.destroy();
        if (this.subscriber) await this.subscriber.destroy();
    }
}
