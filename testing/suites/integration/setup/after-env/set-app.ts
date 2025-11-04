import { faker } from '@faker-js/faker/.';
import { EmailsQueueMock } from '@integration/mocks/queues/emails.queue.mock';
import { testKit } from '@integration/utils/test-kit.util';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { RedisClientAdapter } from 'src/common/redis/redis.client.adapter';
import { AuthConfigService } from 'src/config/services/auth.config.service';
import { EMAILS_QUEUE } from 'src/emails/constants/emails.constants';
import { UserSeedService } from 'src/seed/services/user-seed.service';
import { SESSIONS_REDIS_CONNECTION } from 'src/sessions/constants/sessions.constants';
import { TOKENS_REDIS_CONNECTION } from 'src/tokens/constants/tokens.constants';
import { User } from 'src/users/entities/user.entity';
import * as request from 'supertest';
import { DataSource } from 'typeorm';

let nestApp: NestExpressApplication;

beforeAll(async () => {
    try {
        // Application
        const testingModule: TestingModule = await Test.createTestingModule({
            imports: [await import('src/app/app.module').then((m) => m.AppModule)],
        })
            .overrideProvider(EMAILS_QUEUE)
            .useClass(EmailsQueueMock)
            .compile();

        nestApp = testingModule.createNestApplication<NestExpressApplication>();
        nestApp.set('trust proxy', 'loopback'); // allow X-Forwarded-For from localhost
        await nestApp.init();

        // Testkit
        testKit.app = nestApp;
        testKit.userSeed = nestApp.get(UserSeedService);
        testKit.authConfig = nestApp.get(AuthConfigService);
        testKit.userRepos = nestApp.get(DataSource).getRepository(User);
        testKit.tokensRedisClient = nestApp.get<RedisClientAdapter>(TOKENS_REDIS_CONNECTION);
        testKit.sessionsRedisClient = nestApp.get<RedisClientAdapter>(SESSIONS_REDIS_CONNECTION);

        // Returns a new a graphql request coming from a random ip address
        // on each call
        Object.defineProperty(testKit, 'gqlClient', {
            get: () =>
                request(testKit.app.getHttpServer())
                    .post('/graphql')
                    .set('X-Forwarded-For', faker.internet.ip()),
        });
        // Returns a new a REST request coming from a random ip address
        // on each call
        Object.defineProperty(testKit, 'restClient', {
            get: () => {
                const client = request(testKit.app.getHttpServer());
                return {
                    get: (url: string) =>
                        client.get(url).set('X-Forwarded-For', faker.internet.ip()),
                    post: (url: string) =>
                        client.post(url).set('X-Forwarded-For', faker.internet.ip()),
                    put: (url: string) =>
                        client.put(url).set('X-Forwarded-For', faker.internet.ip()),
                    delete: (url: string) =>
                        client.delete(url).set('X-Forwarded-For', faker.internet.ip()),
                };
            },
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
