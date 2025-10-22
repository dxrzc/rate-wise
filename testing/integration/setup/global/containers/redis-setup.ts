import { createRedisContainer } from '../helpers/create-redis-container.helper';
import { promises as fs } from 'fs';
import { join } from 'path';

export async function createRedisInstances() {
    // auth
    const { container: redisAuthContainer, uri: redisAuthUri } =
        await createRedisContainer('redis-auth');
    await fs.writeFile(join(__dirname, 'redis-auth-uri.txt'), redisAuthUri);

    // queues
    const { container: redisQueuesContainer, uri: redisQueuesUri } =
        await createRedisContainer('redis-queues');
    await fs.writeFile(join(__dirname, 'redis-queues-uri.txt'), redisQueuesUri);

    globalThis.redisAuthContainer = redisAuthContainer;
    globalThis.redisQueuesContainer = redisQueuesContainer;
}
