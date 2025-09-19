/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/**
 * node-redis has serious performance issues when working with typescript
 * so do not use the "RedisClientType" type.
 */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { IRedisClient } from '../interfaces/redis/redis-client.interface';
import { createClient } from '@redis/client';

export class RedisConnectionManager {
    private redis: any;

    constructor(private readonly redisOpts: IRedisClient) {}

    get client() {
        return this.redis;
    }

    async connect() {
        this.redis = await createClient({ url: this.redisOpts.uri })
            .on('error', (err) => console.log('Redis Client Error', err))
            .connect();
    }

    async disconnect() {
        await this.redis.destroy();
    }
}
