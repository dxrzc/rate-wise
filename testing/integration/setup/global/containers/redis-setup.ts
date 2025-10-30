import { promises as fs } from 'fs';
import { join } from 'path';
import { createRedisContainer } from '../helpers/create-redis-container.helper';
import { AllowedRedisServices } from '../types/allowed-redis-services.type';

async function createRedis(type: AllowedRedisServices): Promise<void> {
    const redisAuthUri = await createRedisContainer(type);
    await fs.writeFile(join(__dirname, `${type}-uri.txt`), redisAuthUri);
}

export async function createRedisInstances() {
    await Promise.all([createRedis('redis-auth')]);
}
