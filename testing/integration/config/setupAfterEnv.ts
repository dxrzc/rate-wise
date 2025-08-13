import { DataSource } from 'typeorm';
import { App } from 'supertest/types';
import { expect } from '@jest/globals';
import { AppModule } from 'src/app/app.module';
import { testKit } from '../utils/test-kit.util';
import { INestApplication } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { RedisService } from 'src/redis/redis.service';
import { notToFail } from './custom-matchers/not-to-fail';
import { toFailWith } from './custom-matchers/to-fail-with';
import { UserSeedService } from 'src/seed/services/user-seed.service';
import { SessionConfigService } from 'src/config/services/session-config.service';
import { User } from 'src/users/entities/user.entity';

let nestApp: INestApplication<App>;

expect.extend({
    toFailWith,
    notToFail,
});

beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
    }).compile();
    nestApp = moduleFixture.createNestApplication();
    const dataSource = nestApp.get(DataSource);
    testKit.app = nestApp;
    testKit.userSeed = nestApp.get(UserSeedService);
    testKit.sessionConfig = nestApp.get(SessionConfigService);
    testKit.userRepos = dataSource.getRepository(User);
    await nestApp.init();
});

afterAll(async () => {
    if (nestApp) {
        const dataSource = nestApp.get<DataSource>(getDataSourceToken());
        const redisService = nestApp.get<RedisService>(RedisService);
        await dataSource.dropDatabase();
        await dataSource.destroy();
        redisService.disconnect();
        await nestApp.close();
    }
});
