import { DataSource } from 'typeorm';

export default new DataSource({
    url: process.env.POSTGRES_URI,
    synchronize: false,
    entities: ['dist/**/*.entity.js'],
    type: 'postgres',
    migrations: ['dist/db/migrations/*.js'],
});
