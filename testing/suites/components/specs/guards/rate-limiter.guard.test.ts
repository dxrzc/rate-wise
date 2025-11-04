import { createDisabledLoggerImport } from '@components/imports/create-disabled-logger.import';
import { createGqlImport } from '@components/imports/create-graphql.import';
import { generateGqlQuery } from '@components/utils/generate-test-gql-query.util';
import { faker } from '@faker-js/faker/.';
import { APP_GUARD } from '@nestjs/core';
import { Query, Resolver } from '@nestjs/graphql';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { ThrottlerModule } from '@nestjs/throttler';
import { THROTTLE_CONFIG } from 'src/common/constants/throttle.config.constants';
import { UltraCriticalThrottle } from 'src/common/decorators/throttling.decorator';
import { Code } from 'src/common/enum/code.enum';
import { RateLimiterGuard } from 'src/common/guards/rate-limiter.guard';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';
import * as request from 'supertest';

@Resolver()
class TestResolver {
    @Query(() => Boolean)
    @UltraCriticalThrottle()
    ultraCriticalQuery() {
        return true;
    }
}

const testQuery = generateGqlQuery(TestResolver.prototype.ultraCriticalQuery.name);

describe('RateLimiter Guard', () => {
    let testingModule: TestingModule;
    let app: NestExpressApplication;
    let mockReqData: { user: { id: string } };

    beforeEach(() => {
        mockReqData = {
            user: {
                id: '12345',
            },
        };
    });

    beforeAll(async () => {
        testingModule = await Test.createTestingModule({
            imports: [
                ...createDisabledLoggerImport(),
                ...createGqlImport(() => mockReqData),
                ThrottlerModule.forRoot({
                    throttlers: [{ ttl: 10000, limit: 10 * 1000 }],
                }),
            ],
            providers: [{ provide: APP_GUARD, useClass: RateLimiterGuard }, TestResolver],
        }).compile();
        app = testingModule.createNestApplication({});
        app.set('trust proxy', 'loopback'); // allow X-Forwarded-For from localhost
        app.useLogger(false);
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('User not authenticated', () => {
        describe('Requests from the same ip exceeds the rate limit stablished', () => {
            test('return TOO MANY REQUESTS code and message', async () => {
                const commonReqsIp = faker.internet.ip();
                for (let i = 0; i < THROTTLE_CONFIG.ULTRA_CRITICAL.limit; i++) {
                    const req = await request(app.getHttpServer())
                        .post('/graphql')
                        .set('X-Forwarded-For', commonReqsIp)
                        .send({ query: testQuery });
                    expect(req).notToFail();
                }
                const req = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('X-Forwarded-For', commonReqsIp)
                    .send({ query: testQuery });
                expect(req).toFailWith(Code.TOO_MANY_REQUESTS, COMMON_MESSAGES.TOO_MANY_REQUESTS);
            });
        });
    });

    describe('User is authenticated', () => {
        describe('Requests coming from different ips exceeds the rate limit stablished', () => {
            test('return TOO MANY REQUESTS code and message', async () => {
                mockReqData.user.id = faker.string.uuid(); // mock authenticated in req (req.user.id)
                for (let i = 0; i < THROTTLE_CONFIG.ULTRA_CRITICAL.limit; i++) {
                    const req = await request(app.getHttpServer())
                        .post('/graphql')
                        .set('X-Forwarded-For', faker.internet.ip())
                        .send({ query: testQuery });
                    expect(req).notToFail();
                }
                const req = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('X-Forwarded-For', faker.internet.ip())
                    .send({ query: testQuery });
                expect(req).toFailWith(Code.TOO_MANY_REQUESTS, COMMON_MESSAGES.TOO_MANY_REQUESTS);
            });
        });
    });
});
