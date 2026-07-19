import { GenericContainer } from 'testcontainers';

export async function createLightweightRedisContainer(extraConfig?: string[]) {
    const conf = `
            appendonly no
            save ""
            ${extraConfig ? extraConfig.join('\n') : ''}
    `;
    const container = await new GenericContainer('redis:8.0-alpine')
        .withExposedPorts(6379)
        .withCopyContentToContainer([
            {
                content: conf,
                target: '/usr/local/etc/redis/redis.conf',
            },
        ])
        .withCommand(['redis-server', '/usr/local/etc/redis/redis.conf'])
        .withTmpFs({ '/data': 'rw' })
        .start();
    return `redis://${container.getHost()}:${container.getMappedPort(6379)}`;
}
