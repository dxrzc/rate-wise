import { createRedisContainer } from './helpers/create-redis-container.helper';

export async function createRedisInstances() {
    const redisAuthUri = await createRedisContainer('redis-auth');
    return {
        redisAuth: redisAuthUri,
    };
}
