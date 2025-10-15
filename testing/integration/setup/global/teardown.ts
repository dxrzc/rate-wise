import { promises as fs } from 'fs';
import { join } from 'path';
import { StartedTestContainer } from 'testcontainers';

export default async function () {
    try {
        await Promise.all([
            fs.rm(join(__dirname, 'containers/postgres-uri.txt'), {
                force: true,
            }),
            fs.rm(join(__dirname, 'containers/redis-auth-uri.txt'), {
                force: true,
            }),
            (globalThis.psqlContainer as StartedTestContainer).stop(),
            (globalThis.redisAuthContainer as StartedTestContainer).stop(),
        ]);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}
