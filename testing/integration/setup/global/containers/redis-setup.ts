import { createRedisContainer } from '../helpers/create-redis-container.helper';
import { promises as fs } from 'fs';
import { join } from 'path';

export async function createRedisInstances() {
    const { container, uri: redisAuthUri } =
        await createRedisContainer('redis-auth');
    await fs.writeFile(join(__dirname, 'redis-auth-uri.txt'), redisAuthUri);
    globalThis.redisAuthContainer = container;
}
