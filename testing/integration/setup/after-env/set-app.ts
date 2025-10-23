import { DataSource } from 'typeorm';
import { App } from 'supertest/types';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { User } from 'src/users/entities/user.entity';
import { UserSeedService } from 'src/seed/services/user-seed.service';
import { AuthConfigService } from 'src/config/services/auth.config.service';
import { REDIS_AUTH } from 'src/redis/constants/redis.constants';
import { RedisService } from 'src/redis/redis.service';
import { testKit } from '@integration/utils/test-kit.util';
import * as request from 'supertest';

let nestApp: INestApplication<App>;

beforeAll(async () => {
    try {
        // Application
        const testingModule: TestingModule = await Test.createTestingModule({
            imports: [
                await import('src/app/app.module').then((m) => m.AppModule),
            ],
        }).compile();
        nestApp = testingModule.createNestApplication();
        await nestApp.init();

        // Testkit
        testKit.app = nestApp;
        testKit.userSeed = nestApp.get(UserSeedService);
        testKit.authConfig = nestApp.get(AuthConfigService);
        testKit.userRepos = nestApp.get(DataSource).getRepository(User);
        testKit.redisAuth = nestApp.get<RedisService>(REDIS_AUTH);
        Object.defineProperty(testKit, 'request', {
            get: () => request(testKit.app.getHttpServer()).post('/graphql'),
        });
    } catch (error) {
        await nestApp.close();
        console.error(error);
        process.exit(1);
    }
});

afterAll(async () => {
    await nestApp.close();
});
