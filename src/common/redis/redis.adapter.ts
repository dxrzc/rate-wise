/**
 * node-redis has serious performance issues when working with typescript
 * so do not use the "RedisClientType" type.
 */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { IRedisClient } from '../interfaces/redis/redis-client.interface';
import { createClient } from '@redis/client';

export class RedisAdapter {
    private readonly redis: any;

    constructor(private readonly redisOpts: IRedisClient) {
        this.redis = createClient({
            url: redisOpts.uri,
        });
        this.redis.connect();
    }

    get client() {
        return this.redis;
    }

    /**
     * Adds a member to a Redis set.
     */
    async setAdd(key: string, member: string): Promise<void> {
        await this.redis.sAdd(key, member);
    }

    /**
     * Removes a member from a Redis set.
     */
    async setRem(key: string, member: string): Promise<void> {
        await this.redis.sRem(key, member);
    }

    /**
     * Checks if a member exists in a Redis set.
     */
    async setIsMember(key: string, member: string): Promise<boolean> {
        return (await this.redis.sIsMember(key, member)) === 1;
    }

    /**
     * Retrieves all members of a Redis set.
     */
    async setMembers(key: string): Promise<string[]> {
        return await this.redis.sMembers(key);
    }

    /**
     * Returns the number of members in a Redis set.
     */
    async setSize(key: string): Promise<number> {
        return await this.redis.sCard(key);
    }

    /**
     * Deletes a key from Redis.
     */
    async delete(key: string): Promise<void> {
        await this.redis.del(key);
    }

    /**
     * Stores a value in Redis.
     */
    async store(
        key: string,
        data: string | number | object,
        expTimeSeconds?: number,
    ): Promise<void> {
        if (typeof data === 'object') {
            data = JSON.stringify(data);
        }
        if (expTimeSeconds) {
            await this.redis.set(key, data.toString(), { EX: expTimeSeconds });
        } else {
            await this.redis.set(key, data.toString());
        }
    }

    /**
     * Retrieves a value from Redis.
     */
    async get<T>(key: string): Promise<T | null> {
        const data = await this.redis.get(key);
        if (data) {
            try {
                return JSON.parse(data) as T;
            } catch (error) {
                if (error instanceof SyntaxError) return data as T;
                throw error;
            }
        }
        return null;
    }

    /**
     * Performs a Redis transaction (multi/exec).
     */
    transaction() {
        const multi = this.redis.multi();

        const wrapper = {
            setAdd: (key: string, member: string) => {
                multi.sAdd(key, member);
                return wrapper;
            },
            store: (key: string, value: string) => {
                multi.set(key, value);
                return wrapper;
            },
            exec: async () => {
                return await multi.exec();
            },
        };

        return wrapper;
    }
}
