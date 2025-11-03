import { SERVICES_CONFIG_FILE_PATH } from './constants/services-config-file-path.constant';
import { createMailpit } from './containers/mailpit-setup';
import { createDbAndRunMigration } from './containers/postgres-setup';
import { createRedisInstances } from './containers/redis-setup';
import { ServicesConfig } from './types/services.configuration.type';
import { promises as fs } from 'fs';

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
        },
        mailpit: {
            smtpPort: mailpit.smtpPort,
            apiPort: mailpit.apiPort,
        },
    };
    const configString = JSON.stringify(configObject);
    await fs.writeFile(SERVICES_CONFIG_FILE_PATH, configString);
}
