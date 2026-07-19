const { execSync } = require('child_process');
const args = process.argv.slice(2); // migration name
if (args.length === 0) {
    console.error('Migration name not provided');
    process.exit(1);
}

const migrationName = args[0];
const migrationPath = `db/migrations/${migrationName}`;

const command = `npx typeorm -d dist/db/data-source.js migration:generate ${migrationPath}`;
execSync(command, { stdio: 'inherit' });
