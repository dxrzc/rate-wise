import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { runMigration } from './helpers/run-migration.helper';

export async function createDbAndRunMigration() {
    const psqlContainer = await new PostgreSqlContainer('postgres:17.5-alpine')
        .withDatabase('ratewise_template')
        .withTmpFs({ '/var/lib/postgresql/data': 'rw' })
        .start();
    const connectionUri = psqlContainer.getConnectionUri();
    await runMigration(connectionUri);
    return connectionUri;
}
