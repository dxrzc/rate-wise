import { DataSource } from 'typeorm';
import { join } from 'path';

const migrationsPath = join(__dirname, 'migrations', '*.ts');
const entitiesPath = join(__dirname, '..', 'src', '**', '*.entity.ts');

export default new DataSource({
    url: process.env.POSTGRES_URI,
    synchronize: false,
    entities: [entitiesPath],
    type: 'postgres',
    migrations: [migrationsPath],
});
