import { createLightweightRedisContainer } from '../../../common/utils/containers/create-lightweight-redis.util';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { runMigration } from './helpers/run-migration.helper';
import { promises as fs } from 'fs';
import { join } from 'path';

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
    const authRedisContainer = await createLightweightRedisContainer().start();
    await fs.writeFile(
        join(__dirname, 'redis-auth-uri.txt'),
        authRedisContainer.getConnectionUrl(),
    );
    globalThis.authRedisContainer = authRedisContainer;
}
