import { createLightweightRedisContainer } from '@components/utils/create-lightweight-redis.util';
import { SilentHttpLogger } from '@components/utils/silent-http-logger.util';
import { sleep } from '@components/utils/sleep.util';
import { faker } from '@faker-js/faker/.';
import { Test, TestingModule } from '@nestjs/testing';
import { RedisClientAdapter } from 'src/common/redis/redis.client.adapter';
import { HttpLoggerModule } from 'src/http-logger/http-logger.module';
import { SESSIONS_REDIS_CONNECTION } from 'src/sessions/constants/sessions.constants';
import { userSessionsSetKey } from 'src/sessions/functions/sessions-index-key';
import { userAndSessionRelationKey } from 'src/sessions/functions/user-session-relation-key';
import { SessionsModule } from 'src/sessions/sessions.module';
import { SessionsService } from 'src/sessions/sessions.service';

type MockRequestType = {
    sessionID?: string; // always generate your own sessionID
    session: {
        userId: string;
        regenerate: (callback: () => void) => void;
        destroy: jest.MockedFunction<any>;
    };
};

describe('Sessions Service ', () => {
    let testingModule: TestingModule;
    let sessionsService: SessionsService;
    let mockRequest: MockRequestType;
    let redisClient: RedisClientAdapter;

    beforeEach(() => {
        mockRequest = {
            session: {
                userId: 'test-user',
                destroy: jest.fn((cb) => cb && cb()), // simulate successful callback
                regenerate: jest.fn((cb) => {
                    // creates a real session simulating async behavior
                    // eslint-disable-next-line @typescript-eslint/no-misused-promises
                    setImmediate(async () => {
                        await redisClient.store(`session:${mockRequest.sessionID}`, {});
                        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                        cb && cb(); // signal success to promisify()
                    });
                }),
            },
        };
    });

    beforeAll(async () => {
        testingModule = await Test.createTestingModule({
            imports: [
                HttpLoggerModule.forRootAsync({
                    useClass: SilentHttpLogger,
                }),
                SessionsModule.forRootAsync({
                    useFactory: async () => ({
                        cookieMaxAgeMs: 60000,
                        cookieName: 'ssid',
                        cookieSecret: '123',
                        secure: false,
                        connection: {
                            redisUri: await createLightweightRedisContainer([
                                'notify-keyspace-events ExgK',
                            ]),
                        },
                    }),
                }),
            ],
        }).compile();

        await testingModule.init(); // triggers onModuleInit
        sessionsService = testingModule.get(SessionsService);
        redisClient = testingModule.get(SESSIONS_REDIS_CONNECTION);
    });

    afterAll(async () => {
        await testingModule.close();
    });

    describe('create', () => {
        test('req.session.regenerate should be called', async () => {
            mockRequest.sessionID = faker.string.uuid();
            await sessionsService.create(<any>mockRequest, 'test-user-id');
            expect(mockRequest.session.regenerate).toHaveBeenCalledTimes(1);
        });

        test('should create user-sessions index redis set', async () => {
            // create session
            const userId = faker.string.alpha(10);
            mockRequest.sessionID = faker.string.uuid();
            await sessionsService.create(<any>mockRequest, userId);

            // user-sessions index
            const key = userSessionsSetKey(userId);
            const sessSet = await redisClient.setMembers(key);
            expect(sessSet.length).toBe(1);
            expect(sessSet[0]).toBe(mockRequest.sessionID);
        });

        test('should create session-user relation record in redis', async () => {
            // create session
            const userId = faker.string.alpha(10);
            const sid = faker.string.uuid();
            mockRequest.sessionID = sid;
            await sessionsService.create(<any>mockRequest, userId);

            // session-user relation
            const key = userAndSessionRelationKey(sid);
            const sessionOwner = await redisClient.get(key);
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

    describe('deleteAll', () => {
        test('every sessions associated with user should be deleted from redis', async () => {
            const userId = faker.string.alpha(10);

            // create sessions
            const sess1Id = faker.string.uuid();
            mockRequest.sessionID = sess1Id;
            await sessionsService.create(<any>mockRequest, userId);

            const sess2Id = faker.string.uuid();
            mockRequest.sessionID = sess2Id;
            await sessionsService.create(<any>mockRequest, userId);

            // sessions created
            await expect(redisClient.get(`session:${sess1Id}`)).resolves.not.toBeNull();
            await expect(redisClient.get(`session:${sess2Id}`)).resolves.not.toBeNull();

            // sessions deleted
            await sessionsService.deleteAll(userId);
            await expect(redisClient.get(`session:${sess1Id}`)).resolves.toBeNull();
            await expect(redisClient.get(`session:${sess2Id}`)).resolves.toBeNull();
        });
    });

    describe('Sessions cleanup (redis)', () => {
        test('session id is deleted from user-sessions-index', async () => {
            // create session
            const userId = faker.string.alpha(10);
            const sid = faker.string.uuid();
            mockRequest.sessionID = sid;
            await sessionsService.create(<any>mockRequest, userId);

            // sid in index
            const indexKey = userSessionsSetKey(userId);
            expect(await redisClient.setSize(indexKey)).toBe(1);

            // delete session from redis, this will trigger the cleanup
            await redisClient.delete(`session:${sid}`);
            await sleep(1000); // redis subscriber works async

            // session should not exist in sessions-index anymore
            const index = await redisClient.setMembers(indexKey);
            expect(index.length).toBe(0);
        });

        test('session-user relation is deleted', async () => {
            // create session
            const userId = faker.string.alpha(10);
            const sid = faker.string.uuid();
            mockRequest.sessionID = sid;
            await sessionsService.create(<any>mockRequest, userId);

            // sid-user relation exists
            const relationKey = userAndSessionRelationKey(sid);
            await expect(redisClient.get(relationKey)).resolves.not.toBeNull();

            // delete session from redis, this will trigger the cleanup
            await redisClient.delete(`session:${sid}`);
            await sleep(1000); // redis subscriber works async

            // sid-user relation should not exists anymore
            const relation = await redisClient.get(relationKey);
            expect(relation).toBeNull();
        });
    });
});
