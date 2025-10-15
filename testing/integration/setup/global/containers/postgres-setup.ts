import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { runMigration } from '../helpers/run-migration.helper';
import { promises as fs } from 'fs';
import { join } from 'path';

export async function createDbAndRunMigration() {
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
}
