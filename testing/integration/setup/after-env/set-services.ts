import { cloneDatabase } from './helpers/clone-database.helper';
import { readSvcConnection } from './helpers/read-service-url.helper';

// Same redis instance for all the tests
// Postgres db is cloned before each test file
beforeAll(async () => {
    try {
        const [
            postgresUrl,
            redisAuthUrl,
            redisQueueUrl,
            mailpitPort,
            mailpitApiPort,
        ] = await Promise.all([
            readSvcConnection('postgres-uri'),
            readSvcConnection('redis-auth-uri'),
            readSvcConnection('redis-queues-uri'),
            readSvcConnection('mailpit-port'),
            readSvcConnection('mailpit-api-port'),
        ]);
        process.env.POSTGRES_URI = await cloneDatabase(postgresUrl);
        process.env.REDIS_AUTH_URI = redisAuthUrl;
        // TODO: not used
        process.env.REDIS_QUEUES_URI = redisQueueUrl;
        process.env.SMTP_PORT = mailpitPort;
        process.env.SMTP_HOST = 'localhost';
        process.env.SMTP_USER = 'any';
        process.env.SMTP_PASS = 'any';

        // test only
        process.env.MAILPIT_API_PORT = mailpitApiPort;
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
});
