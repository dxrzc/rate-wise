import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.dev' });

export default new DataSource({
    url: process.env.POSTGRES_URI,
    synchronize: false,
    entities: ['dist/**/*.entity.js'],
    type: 'postgres',
    migrations: ['dist/db/development/migrations/*.js'],
});
