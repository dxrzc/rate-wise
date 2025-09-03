import { StartedPostgreSqlContainer } from '@testcontainers/postgresql';
import { promises as fs } from 'fs';
import { join } from 'path';

export default async function () {
    await Promise.all([
        fs.rm(join(__dirname, 'postgres-uri.txt'), { force: true }),
        (globalThis.psqlContainer as StartedPostgreSqlContainer).stop(),
    ]);
}
