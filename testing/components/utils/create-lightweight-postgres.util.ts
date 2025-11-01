import { PostgreSqlContainer } from '@testcontainers/postgresql';

export async function createLightWeightPostgres(): Promise<string> {
    const psqlContainer = await new PostgreSqlContainer('postgres:17.5-alpine')
        .withDatabase('ratewise_template')
        .withTmpFs({ '/var/lib/postgresql/data': 'rw' })
        .start();
    return psqlContainer.getConnectionUri();
}
