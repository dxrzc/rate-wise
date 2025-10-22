import { cloneDatabase } from './helpers/clone-database.helper';
import { readDbUrl } from './helpers/read-db-url';

// Same redis instance for all the tests
// Postgres db is cloned before each test file
beforeAll(async () => {
    try {
        const [postgresUrl, redisAuthUrl, redisQueueUrl] = await Promise.all([
            readDbUrl('postgres'),
            readDbUrl('redis-auth'),
            readDbUrl('redis-queues'),
        ]);
        process.env.POSTGRES_URI = await cloneDatabase(postgresUrl);
        process.env.REDIS_AUTH_URI = redisAuthUrl;
        process.env.REDIS_QUEUES_URI = redisQueueUrl;
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
});
