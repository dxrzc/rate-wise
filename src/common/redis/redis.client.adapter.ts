/**
 * node-redis has serious performance issues when working with typescript
 * so do not use the "RedisClientType" type.
 */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { RedisConnection } from './redis.connection';

export class RedisClientAdapter {
    private readonly _connection: RedisConnection;

    constructor(
        private readonly redisUri: any,
        private readonly context: string,
    ) {
        this._connection = new RedisConnection(redisUri, context);
    }

    get connection() {
        return this._connection;
    }

    private get client() {
        return this.connection.client;
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
     * Checks if a key exists in Redis.
     */
    async exists(key: string): Promise<boolean> {
        return (await this.client.exists(key)) === 1;
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
            await this.client.set(key, data.toString(), {
                EX: expTimeSeconds,
            });
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
