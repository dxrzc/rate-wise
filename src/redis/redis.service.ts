import { createClient } from 'redis';
import { RedisClientType } from '@redis/client';
import { Inject, Injectable } from '@nestjs/common';
import { RedisSuscriber } from './suscribers/redis.suscriber';
import { MODULE_OPTIONS_TOKEN } from './redis.module-definition';
import { rethrowIfFails } from 'src/common/functions/error/rethrow-if-fails';
import { IRedisModuleOptions } from './interfaces/redis-module-options.interface';

// TODO: listen to error events
@Injectable()
export class RedisService {
    private redisClient: RedisClientType;

    constructor(
        @Inject(MODULE_OPTIONS_TOKEN)
        private readonly redisOpts: IRedisModuleOptions,
        private readonly redisSuscriber: RedisSuscriber,
    ) {
        this.redisClient = createClient({ url: redisOpts.uri });
        rethrowIfFails(this.connect());
    }

    async connect() {
        await this.redisClient.connect();
        await this.redisClient.configSet('notify-keyspace-events', 'ExgK');
        await this.redisSuscriber.suscribe(this.redisClient);
    }

    get client() {
        return this.redisClient;
    }

    async set(key: string, value: string) {
        await this.redisClient.set(key, value);
    }

    async get<T>(key: string): Promise<T | null> {
        const data = await this.redisClient.get(key);
        if (data) {
            try {
                return JSON.parse(data) as T;
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (error) {
                return data as T;
            }
        }
        return null;
    }

    async addToSet(key: string, member: string): Promise<void> {
        await this.redisClient.sAdd(key, member);
    }

    async getSetSize(key: string): Promise<number> {
        return await this.redisClient.sCard(key);
    }

    async deleteFromSet(key: string, member: string): Promise<number> {
        return await this.redisClient.sRem(key, member);
    }
}
