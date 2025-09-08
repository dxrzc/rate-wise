import { DataSource } from 'typeorm';
import { App } from 'supertest/types';
import { expect } from '@jest/globals';
import { testKit } from '../utils/test-kit.util';
import { INestApplication } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from 'src/users/entities/user.entity';
import { RedisService } from 'src/redis/redis.service';
import { notToFail } from './custom-matchers/not-to-fail';
import { toFailWith } from './custom-matchers/to-fail-with';
import { UserSeedService } from 'src/seed/services/user-seed.service';
import { toContainCookie } from './custom-matchers/to-contain-cookie';
import { RedisContainer, StartedRedisContainer } from '@testcontainers/redis';
import { AuthConfigService } from 'src/config/services/auth.config.service';
import { cloneDatabase } from './helpers/clone-database.helper';
import { Environment } from 'src/common/enum/environment.enum';
import * as request from 'supertest';
import { readFileSync } from 'fs';
import { config } from 'dotenv';
import { join } from 'path';

config({ path: '.env.test' });
process.env.NODE_ENV = Environment.INTEGRATION;

let nestApp: INestApplication<App>;
let redisContainer: StartedRedisContainer;

expect.extend({
    toContainCookie,
    toFailWith,
    notToFail,
});

beforeAll(async () => {
    // Connections
    const templatePostgresDb = readFileSync(
        join(__dirname, 'postgres-uri.txt'),
        'utf8',
    );
    redisContainer = await new RedisContainer('redis:8.0-alpine')
        .withCommand([
            'redis-server',
            '--appendonly',
            'no', // AOF persistence
            '--save',
            '""', // disables snapshots
        ])
        .withTmpFs({ '/data': 'rw' })
        .start();

    process.env.POSTGRES_URI = await cloneDatabase(templatePostgresDb);
    process.env.REDIS_URI = redisContainer.getConnectionUrl();

    // Application
    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [await import('src/app/app.module').then((m) => m.AppModule)], // loaded with new envs
    }).compile();
    nestApp = moduleFixture.createNestApplication();
    await nestApp.init();

    // Test utils
    testKit.app = nestApp;
    testKit.userSeed = nestApp.get(UserSeedService);
    testKit.authConfig = nestApp.get(AuthConfigService);
    testKit.userRepos = nestApp.get(DataSource).getRepository(User);
    testKit.redisService = nestApp.get(RedisService);
    Object.defineProperty(testKit, 'request', {
        get: () => request(testKit.app.getHttpServer()).post('/graphql'),
    });
});

afterAll(async () => {
    if (nestApp) {
        const dataSource = nestApp.get<DataSource>(getDataSourceToken());
        const redisService = nestApp.get<RedisService>(RedisService);
        redisService.disconnect();
        await Promise.all([
            dataSource.destroy(),
            nestApp.close(),
            redisContainer.stop(),
        ]);
    }
});
