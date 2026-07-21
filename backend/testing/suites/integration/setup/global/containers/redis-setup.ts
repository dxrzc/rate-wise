import { createRedisContainer } from './helpers/create-redis-container.helper';

export async function createRedisInstances() {
    const redisAuthUri = await createRedisContainer('redis-auth');
    const redisCacheUri = await createRedisContainer('redis-cache');
    return {
        redisAuth: redisAuthUri,
        redisCache: redisCacheUri,
    };
}
