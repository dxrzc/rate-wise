import { exec as execCb } from 'child_process';
import { promisify } from 'util';

const exec = promisify(execCb);

export async function runMigration(targetUri: string) {
    await exec(
        `npx nest build && npx typeorm -d dist/db/data-source.js migration:run`,
        {
            env: { ...process.env, POSTGRES_URI: targetUri },
            cwd: process.cwd(),
        },
    );
}
