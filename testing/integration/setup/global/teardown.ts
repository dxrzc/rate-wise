import { promises as fs } from 'fs';
import { join } from 'path';

export default async function () {
    try {
        await Promise.all([
            await fs.rm(join(__dirname, 'containers/postgres-uri.txt')),
            await fs.rm(join(__dirname, 'containers/redis-auth-uri.txt')),
            await fs.rm(join(__dirname, 'containers/redis-queues-uri.txt')),
        ]);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}
