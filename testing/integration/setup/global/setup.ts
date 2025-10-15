import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { runMigration } from './helpers/run-migration.helper';
import { promises as fs } from 'fs';
import { join } from 'path';
import { GenericContainer } from 'testcontainers';

export default async function () {
    // POSTGRES
    const psqlContainer = await new PostgreSqlContainer('postgres:17.5-alpine')
        .withDatabase('ratewise_template')
        .withTmpFs({ '/var/lib/postgresql/data': 'rw' })
        .start();
    const postgresUri = psqlContainer.getConnectionUri();
    await Promise.all([
        fs.writeFile(join(__dirname, 'postgres-uri.txt'), postgresUri),
        runMigration(postgresUri),
    ]);
    globalThis.psqlContainer = psqlContainer;

    // REDIS
    const redisConf =
        (await fs.readFile(
            join(process.cwd(), 'redis/redis-auth.conf'),
            'utf8',
        )) +
        `
        appendonly no
        save ""
        `;

    const authRedisContainer = await new GenericContainer('redis:8.0-alpine')
        .withExposedPorts(6379)
        .withCopyContentToContainer([
            {
                content: redisConf,
                target: '/usr/local/etc/redis/redis.conf',
            },
        ])
        .withCommand(['redis-server', '/usr/local/etc/redis/redis.conf'])
        .start();

    await fs.writeFile(
        join(__dirname, 'redis-auth-uri.txt'),
        `redis://${authRedisContainer.getHost()}:${authRedisContainer.getMappedPort(6379)}`,
    );
    globalThis.authRedisContainer = authRedisContainer;
}
