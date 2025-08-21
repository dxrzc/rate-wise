import * as dotenvExpand from 'dotenv-expand';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenvExpand.expand(dotenv.config({ path: '.env.dev' }));

export default new DataSource({
    url: process.env.POSTGRES_URI,
    synchronize: false,
    entities: ['dist/**/*.entity.js'],
    type: 'postgres',
    migrations: ['dist/db/migrations/*.js'],
});
