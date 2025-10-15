import { RedisContainer } from '@testcontainers/redis';

export function createLightweightRedisContainer() {
    return new RedisContainer('redis:8.0-alpine')
        .withCommand([
            'redis-server',
            '--appendonly',
            'no', // AOF persistence
            '--save',
            '""', // disables snapshots
        ])
        .withTmpFs({ '/data': 'rw' });
}
