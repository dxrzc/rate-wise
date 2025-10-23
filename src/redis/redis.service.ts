/**
 * node-redis has serious performance issues when working with typescript
 * so do not use the "RedisClientType" type.
 */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { RedisConnection } from './connections/redis.connection';
import { RedisType } from './enum/redis-type.enum';

export class RedisService {
    private readonly _connection: RedisConnection;

    constructor(
        private readonly _client: any,
        private readonly type: RedisType,
    ) {
        this._connection = new RedisConnection(_client, type);
    }

    get client() {
        return this._client;
    }

    get connection() {
        return this._connection;
    }

    /**
     * Adds a member to a Redis set.
     */
    async setAdd(key: string, member: string): Promise<void> {
        await this._client.sAdd(key, member);
    }

    /**
     * Removes a member from a Redis set.
     */
    async setRem(key: string, member: string): Promise<void> {
        await this._client.sRem(key, member);
    }

    /**
     * Checks if a member exists in a Redis set.
     */
    async setIsMember(key: string, member: string): Promise<boolean> {
        return (await this._client.sIsMember(key, member)) === 1;
    }

    /**
     * Retrieves all members of a Redis set.
     */
    async setMembers(key: string): Promise<string[]> {
        return await this._client.sMembers(key);
    }

    /**
     * Returns the number of members in a Redis set.
     */
    async setSize(key: string): Promise<number> {
        return await this._client.sCard(key);
    }

    /**
     * Deletes a key from Redis.
     */
    async delete(key: string): Promise<void> {
        await this._client.del(key);
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
            await this._client.set(key, data.toString(), {
                EX: expTimeSeconds,
            });
        } else {
            await this._client.set(key, data.toString());
        }
    }

    /**
     * Retrieves a value from Redis.
     */
    async get<T>(key: string): Promise<T | null> {
        const data = await this._client.get(key);
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
        const multi = this._client.multi();

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
