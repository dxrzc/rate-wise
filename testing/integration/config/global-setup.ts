import * as compose from 'docker-compose';
import * as path from 'path';

export default async function () {
    const services = ['postgres-test', 'redis-test'];
    global.services = services;
    await compose.upMany(services, {
        cwd: path.join(__dirname),
        log: true,
        env: {
            ...process.env,
        },
    });
}
