import { exec as execCb } from 'child_process';
import { promisify } from 'util';

const exec = promisify(execCb);

export async function runMigration(targetUri: string) {
    console.log('\n');
    console.log('\x1b[34m%s\x1b[0m', 'Running migration...');
    await exec(`npx nest build && npx typeorm -d dist/db/data-source.js migration:run`, {
        env: { ...process.env, POSTGRES_URI: targetUri },
        cwd: process.cwd(),
    });
    console.log('\x1b[32m%s\x1b[0m', 'Migration executed successfully');
}
