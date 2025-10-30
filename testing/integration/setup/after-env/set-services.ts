import { cloneDatabase } from './helpers/clone-database.helper';
import { readSvcConnection } from './helpers/read-service-url.helper';

// Same redis instances for all the tests (auth, cache, etc.)
// Postgres db is cloned before each test file
beforeAll(async () => {
    try {
        const [postgresUrl, redisAuthUrl, mailpitPort, mailpitApiPort] =
            await Promise.all([
                readSvcConnection('postgres-uri'),
                readSvcConnection('redis-auth-uri'),
                readSvcConnection('mailpit-port'),
                readSvcConnection('mailpit-api-port'),
            ]);

        // Cloned database for test isolation
        process.env.POSTGRES_URI = await cloneDatabase(postgresUrl);

        process.env.REDIS_AUTH_URI = redisAuthUrl;
        process.env.REDIS_QUEUES_URI = redisAuthUrl; // Queues are mocked so the redis uri is not important but needed

        // Mailpit settings
        process.env.SMTP_PORT = mailpitPort;
        process.env.SMTP_HOST = 'localhost';
        process.env.SMTP_USER = 'any';
        process.env.SMTP_PASS = 'any';

        // Used in "emailSentToThisAddress" matcher
        process.env.MAILPIT_API_PORT = mailpitApiPort;
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
});
