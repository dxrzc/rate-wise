import { createMailpit } from './containers/mailpit-setup';
import { createDbAndRunMigration } from './containers/postgres-setup';
import { createRedisInstances } from './containers/redis-setup';
import { ServicesConfig } from './types/services.configuration.type';

export default async function () {
    const [postgresUri, redisInstances, mailpit] = await Promise.all([
        createDbAndRunMigration(),
        createRedisInstances(),
        createMailpit(),
    ]);
    const configObject: ServicesConfig = {
        postgresUrl: postgresUri,
        redisUrls: {
            auth: redisInstances.redisAuth,
            cache: redisInstances.redisCache,
        },
        mailpit: {
            smtpPort: mailpit.smtpPort,
            apiPort: mailpit.apiPort,
        },
    };
    process.env.config = JSON.stringify(configObject);
}
