import { faker } from '@faker-js/faker/.';
import { Test, TestingModule } from '@nestjs/testing';
import { RedisContainer } from '@testcontainers/redis';
import { HttpLoggerModule } from 'src/http-logger/http-logger.module';
import { REDIS_AUTH } from 'src/redis/constants/redis.constants';
import { RedisModule } from 'src/redis/redis.module';
import { RedisService } from 'src/redis/redis.service';
import { userSessionsSetKey } from 'src/sessions/functions/sessions-index-key';
import { userAndSessionRelationKey } from 'src/sessions/functions/user-session-relation-key';
import { SessionsModule } from 'src/sessions/sessions.module';
import { SessionsService } from 'src/sessions/sessions.service';

type MockRequestType = {
    sessionID: string;
    session: {
        userId: string;
        regenerate: jest.MockedFunction<any>;
        destroy: jest.MockedFunction<any>;
    };
};

describe('Sessions Service ', () => {
    let testingModule: TestingModule;
    let sessionsService: SessionsService;
    let mockRequest: MockRequestType;
    let redisService: RedisService;

    beforeEach(() => {
        mockRequest = {
            sessionID: 'mock-session-id',
            session: {
                userId: 'test-user',
                regenerate: jest.fn((cb) => cb && cb()), // simulate successful callback
                destroy: jest.fn((cb) => cb && cb()), // simulate successful callback
            },
        };
    });

    beforeAll(async () => {
        const redisContainer = await new RedisContainer('redis:8.0-alpine')
            .withCommand([
                'redis-server',
                '--appendonly',
                'no', // AOF persistence
                '--save',
                '""', // disables snapshots
            ])
            .withTmpFs({ '/data': 'rw' })
            .start();

        testingModule = await Test.createTestingModule({
            imports: [
                HttpLoggerModule.forRootAsync({
                    useFactory: () => ({
                        messages: {
                            console: { silent: true },
                            filesystem: {
                                silent: true,
                            },
                        },
                        requests: {
                            silent: true,
                        },
                    }),
                }),
                RedisModule.forRootAsync({
                    useFactory: () => ({
                        redisAuth: redisContainer.getConnectionUrl(),
                    }),
                }),
                SessionsModule.forRootAsync({
                    useFactory: () => ({
                        cookieMaxAgeMs: 60000,
                        cookieName: 'ssid',
                        cookieSecret: '123',
                        secure: false,
                    }),
                }),
            ],
        }).compile();

        sessionsService = testingModule.get(SessionsService);
        redisService = testingModule.get<RedisService>(REDIS_AUTH);
    });

    afterAll(async () => {
        await testingModule.close();
    });

    describe('create', () => {
        test('req.session.regenerate should be called', async () => {
            await sessionsService.create(<any>mockRequest, '123');
            expect(mockRequest.session.regenerate).toHaveBeenCalledTimes(1);
        });

        test('should create user-sessions index redis set', async () => {
            const userId = faker.string.alpha(10);
            await sessionsService.create(<any>mockRequest, userId);
            const key = userSessionsSetKey(userId);
            const sessSet = await redisService.setMembers(key);
            expect(sessSet.length).toBe(1);
            expect(sessSet[0]).toBe(mockRequest.sessionID);
        });

        test('should create session-user relation record in redis', async () => {
            const userId = faker.string.alpha(10);
            await sessionsService.create(<any>mockRequest, userId);
            const key = userAndSessionRelationKey(mockRequest.sessionID);
            const sessionOwner = await redisService.get(key);
            expect(sessionOwner).toBe(userId);
        });
    });

    describe('count', () => {
        test('should return the number of sessions associated with the user', async () => {
            const userId = faker.string.alpha(10);

            // session1
            mockRequest.sessionID = faker.string.uuid();
            await sessionsService.create(<any>mockRequest, userId);
            // session2
            mockRequest.sessionID = faker.string.uuid();
            await sessionsService.create(<any>mockRequest, userId);

            const userSessions = await sessionsService.count(userId);
            expect(userSessions).toBe(2);
        });
    });

    describe('delete', () => {
        test('req.session.destroy should be called', async () => {
            await sessionsService.delete(<any>mockRequest);
            expect(mockRequest.session.destroy).toHaveBeenCalledTimes(1);
        });
    });
});
