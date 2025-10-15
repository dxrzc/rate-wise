import { join } from 'path';
import { GenericContainer, StartedTestContainer } from 'testcontainers';
import { promises as fs } from 'fs';

type AllowedServices = 'redis-auth' | 'redis-queues' | 'redis-cache';

export async function createRedisContainer(
    serviceName: AllowedServices,
): Promise<{
    container: StartedTestContainer;
    uri: string;
}> {
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
    return {
        container: redisContainer,
        uri: `redis://${redisContainer.getHost()}:${redisContainer.getMappedPort(6379)}`,
    };
}
