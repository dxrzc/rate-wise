import { createMailpit } from './containers/mailpit-setup';
import { createDbAndRunMigration } from './containers/postgres-setup';
import { createRedisInstances } from './containers/redis-setup';

export default async function () {
    await Promise.all([
        createDbAndRunMigration(),
        createRedisInstances(),
        createMailpit(),
    ]);
}
