import * as compose from 'docker-compose';
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

const execAsync = promisify(exec);

export default async function globalSetup() {
    const services = ['postgres-test', 'redis-test'];
    global.services = services;
    console.log('\n');
    console.log('📦 Running containers...');
    await compose.upMany(services, {
        cwd: path.join(__dirname),
        env: {
            ...process.env,
        },
    });
    console.log('✅ Containers started');

    try {
        console.log('🚚 Running migrations...');
        const migr = 'npx typeorm -d dist/db/data-source.int.js migration:run';
        await execAsync('npm run build', { cwd: process.cwd() });
        await execAsync(migr, { cwd: process.cwd() });
        console.log('✅ Migrations completed');
    } catch (err) {
        console.error('❗Error running migration:', err);
        process.exit(1);
    }
}
