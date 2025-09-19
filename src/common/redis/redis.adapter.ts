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
import { RedisConnectionManager } from './redis.connection.manager';

export class RedisAdapter {
    private readonly _connection: RedisConnectionManager;

    constructor(private readonly redisOpts: IRedisClient) {
        this._connection = new RedisConnectionManager(redisOpts);
    }

    get connection(): RedisConnectionManager {
        return this._connection;
    }

    get client(): any {
        return this._connection.client;
    }

    /**
     * Adds a member to a Redis set.
     */
    async setAdd(key: string, member: string): Promise<void> {
        await this.client.sAdd(key, member);
    }

    /**
     * Removes a member from a Redis set.
     */
    async setRem(key: string, member: string): Promise<void> {
        await this.client.sRem(key, member);
    }

    /**
     * Checks if a member exists in a Redis set.
     */
    async setIsMember(key: string, member: string): Promise<boolean> {
        return (await this.client.sIsMember(key, member)) === 1;
    }

    /**
     * Retrieves all members of a Redis set.
     */
    async setMembers(key: string): Promise<string[]> {
        return await this.client.sMembers(key);
    }

    /**
     * Returns the number of members in a Redis set.
     */
    async setSize(key: string): Promise<number> {
        return await this.client.sCard(key);
    }

    /**
     * Deletes a key from Redis.
     */
    async delete(key: string): Promise<void> {
        await this.client.del(key);
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
            await this.client.set(key, data.toString(), { EX: expTimeSeconds });
        } else {
            await this.client.set(key, data.toString());
        }
    }

    /**
     * Retrieves a value from Redis.
     */
    async get<T>(key: string): Promise<T | null> {
        const data = await this.client.get(key);
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
        const multi = this.client.multi();

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
