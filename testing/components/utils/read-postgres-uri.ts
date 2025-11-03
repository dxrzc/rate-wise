import { promises as fs } from 'fs';

export async function readPostgresUrl() {
    return await fs.readFile(
        `${process.cwd()}/testing/components/setup/postgres-uri.txt`,
        'utf8',
    );
}
