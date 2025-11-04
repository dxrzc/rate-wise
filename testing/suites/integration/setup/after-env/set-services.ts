import { SERVICES_CONFIG_FILE_PATH } from '../global/constants/services-config-file-path.constant';
import { ServicesConfig } from '../global/types/services.configuration.type';
import { cloneDatabase } from './helpers/clone-database.helper';
import { promises as fs } from 'fs';

// Same redis instances for all the tests (auth, cache, etc.)
// Postgres db is cloned before each test file
beforeAll(async () => {
    try {
        const configJson = await fs.readFile(SERVICES_CONFIG_FILE_PATH, 'utf-8');
        const { postgresUrl, redisUrls, mailpit } = <ServicesConfig>JSON.parse(configJson);

        // Cloned database for test isolation
        process.env.POSTGRES_URI = await cloneDatabase(postgresUrl);

        // Queues are mocked so the redis uri is not important but needed
        process.env.REDIS_QUEUES_URI = redisUrls.auth;
        process.env.REDIS_AUTH_URI = redisUrls.auth;

        // Mailpit settings
        process.env.SMTP_PORT = mailpit.smtpPort.toString();
        process.env.SMTP_HOST = 'localhost';
        process.env.SMTP_USER = 'any';
        process.env.SMTP_PASS = 'any';

        // Used in "emailSentToThisAddress" matcher
        process.env.MAILPIT_API_PORT = mailpit.apiPort.toString();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
});
