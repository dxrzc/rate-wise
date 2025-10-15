import { DataSource } from 'typeorm';
import { App } from 'supertest/types';
import { expect } from '@jest/globals';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from 'src/users/entities/user.entity';
import { UserSeedService } from 'src/seed/services/user-seed.service';
import { toContainCookie } from '@integration/custom/matchers/to-contain-cookie';
import { AuthConfigService } from 'src/config/services/auth.config.service';
import { toFailWith } from '@integration/custom/matchers/to-fail-with';
import { notToFail } from '@integration/custom/matchers/not-to-fail';
import { cloneDatabase } from './helpers/clone-database.helper';
import { Environment } from 'src/common/enum/environment.enum';
import { REDIS_AUTH } from 'src/redis/constants/redis.constants';
import { RedisService } from 'src/redis/redis.service';
import { testKit } from '@integration/utils/test-kit.util';
import * as request from 'supertest';
import { readFileSync } from 'fs';
import { config } from 'dotenv';
import { join } from 'path';

config({ path: '.env.test' });
process.env.NODE_ENV = Environment.INTEGRATION;

let nestApp: INestApplication<App>;

expect.extend({
    toContainCookie,
    toFailWith,
    notToFail,
});

beforeAll(async () => {
    try {
        // Connections
        const templatePostgresDb = readFileSync(
            join(__dirname, '../global/containers/postgres-uri.txt'),
            'utf8',
        );
        process.env.POSTGRES_URI = await cloneDatabase(templatePostgresDb);
        process.env.REDIS_AUTH_URI = readFileSync(
            join(__dirname, '../global/containers/redis-auth-uri.txt'),
            'utf8',
        );
        // Application
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [
                await import('src/app/app.module').then((m) => m.AppModule),
            ], // loaded with new envs
        }).compile();
        nestApp = moduleFixture.createNestApplication();
        await nestApp.init();

        // Test utils
        testKit.app = nestApp;
        testKit.userSeed = nestApp.get(UserSeedService);
        testKit.authConfig = nestApp.get(AuthConfigService);
        testKit.userRepos = nestApp.get(DataSource).getRepository(User);
        testKit.redisAuth = nestApp.get<RedisService>(REDIS_AUTH);
        Object.defineProperty(testKit, 'request', {
            get: () => request(testKit.app.getHttpServer()).post('/graphql'),
        });
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
});

afterAll(async () => {
    await nestApp.close();
});
