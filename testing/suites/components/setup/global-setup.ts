import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { promises as fs } from 'fs';
import { join } from 'path';

export default async function () {
    // Shared postgres instance
    const psqlContainer = await new PostgreSqlContainer('postgres:17.5-alpine')
        .withDatabase('ratewise_template')
        .withTmpFs({ '/var/lib/postgresql/data': 'rw' })
        .start();
    const postgresUrl = psqlContainer.getConnectionUri();
    await fs.writeFile(join(__dirname, 'postgres-uri.txt'), postgresUrl);
}
