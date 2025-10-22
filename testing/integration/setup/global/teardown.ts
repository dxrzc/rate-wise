import { promises as fs } from 'fs';
import { join } from 'path';

export default async function () {
    try {
        await Promise.all([
            fs.rm(join(__dirname, 'containers/postgres-uri.txt')),
            fs.rm(join(__dirname, 'containers/redis-auth-uri.txt')),
            fs.rm(join(__dirname, 'containers/redis-queues-uri.txt')),
        ]);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}
