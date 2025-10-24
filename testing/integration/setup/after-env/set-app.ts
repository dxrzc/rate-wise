import { testKit } from '@integration/utils/test-kit.util';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RedisClientAdapter } from 'src/common/redis/redis.client.adapter';
import { AuthConfigService } from 'src/config/services/auth.config.service';
import { UserSeedService } from 'src/seed/services/user-seed.service';
import { SESSIONS_REDIS_CONNECTION } from 'src/sessions/constants/sessions.constants';
import { User } from 'src/users/entities/user.entity';
import * as request from 'supertest';
import { App } from 'supertest/types';
import { DataSource } from 'typeorm';

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
        testKit.sessionsRedisClient = nestApp.get<RedisClientAdapter>(
            SESSIONS_REDIS_CONNECTION,
        );
        Object.defineProperty(testKit, 'request', {
            get: () => request(testKit.app.getHttpServer()).post('/graphql'),
        });
    } catch (error) {
        console.error(error);
        if (nestApp) await nestApp.close();
        process.exit(1);
    }
});

afterAll(async () => {
    await nestApp.close();
});
