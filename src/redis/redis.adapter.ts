import Redis from 'ioredis';

export class RedisAdapter {
    constructor(private readonly redis: Redis) {}

    get client() {
        return this.redis;
    }

    /**
     * Adds a member to a Redis set.
     * @param key - The Redis set key.
     * @param member - The member to add.
     */
    async setAdd(key: string, member: string): Promise<void> {
        await this.redis.sadd(key, member);
    }

    /**
     * Removes a member from a Redis set.
     * @param key - The Redis set key.
     * @param member - The member to remove.
     */
    async setRem(key: string, member: string): Promise<void> {
        await this.redis.srem(key, member);
    }

    /**
     * Checks if a member exists in a Redis set.
     * @param key - The Redis set key.
     * @param member - The member to check.
     * @returns True if the member exists, false otherwise.
     */
    async setIsMember(key: string, member: string): Promise<boolean> {
        return (await this.redis.sismember(key, member)) === 1;
    }

    /**
     * Retrieves all members of a Redis set.
     * @param key - The Redis set key.
     * @returns Array of members.
     */
    async setMembers(key: string): Promise<string[]> {
        return await this.redis.smembers(key);
    }

    /**
     * Returns the number of members in a Redis set.
     * @param key - The Redis set key.
     * @returns Number of members.
     */
    async setSize(key: string): Promise<number> {
        return await this.redis.scard(key);
    }

    /**
     * Deletes a value from redis
     * @param key - The Redis key under which the value is stored
     */
    async delete(key: string): Promise<void> {
        await this.redis.del(key);
    }

    /**
     * Stores a value in Redis.
     *
     * - Automatically serializes objects to JSON strings.
     * - Supports optional expiration time in seconds.
     *
     * @param key - The Redis key under which to store the data.
     * @param data - The data to store. Can be a string, number, or object.
     * @param expTimeSeconds - Optional expiration time in seconds.
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
            await this.redis.set(key, data, 'EX', expTimeSeconds);
        } else {
            await this.redis.set(key, data);
        }
    }

    /**
     * Retrieves a value from Redis.
     *
     * - Automatically parses JSON strings back into objects.
     * - Returns `null` if the key does not exist.
     * - Returns the raw value if JSON parsing fails (non-object data).
     *
     * @template T - Expected type of the returned data.
     * @param key - The Redis key to retrieve.
     * @returns The stored value of type `T` or `null` if not found.
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
     * Performs a redis transaction
     * @returns The result of the transaction
     */
    transaction() {
        const multi = this.client.multi();

        const wrapper = {
            setAdd: (key: string, member: string) => {
                multi.sadd(key, member);
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
