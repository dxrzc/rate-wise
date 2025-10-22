import { deleteFile } from './helpers/delete-file.helper';

export default async function () {
    try {
        await Promise.all([
            deleteFile('containers/postgres-uri.txt'),
            deleteFile('containers/redis-auth-uri.txt'),
            deleteFile('containers/redis-queues-uri.txt'),
        ]);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}
