import { join } from 'path';
import { GenericContainer } from 'testcontainers';
import { promises as fs } from 'fs';
import { RedisInstances } from '../../types/redis-instances.type';

/**
 * This disables persistence but loads the configuration stored in redis/redis-*.conf
 * so the container mimics production but its faster at the same time.
 * @returns container url
 */
export async function createRedisContainer(serviceName: RedisInstances) {
    const redisConf =
        (await fs.readFile(
            join(process.cwd(), `redis/${serviceName}.conf`),
            'utf8',
        )) +
        `
            appendonly no
            save ""
            `;

    const redisContainer = await new GenericContainer('redis:8.0-alpine')
        .withExposedPorts(6379)
        .withCopyContentToContainer([
            {
                content: redisConf,
                target: '/usr/local/etc/redis/redis.conf',
            },
        ])
        .withCommand(['redis-server', '/usr/local/etc/redis/redis.conf'])
        .start();

    return `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`;
}
