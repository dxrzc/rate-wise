import { createLightweightRedisContainer } from '@components/utils/create-lightweight-redis.util';
import { sessionIsFullyCleaned } from '@components/utils/session-is-fully-cleaned.util';
import { SilentHttpLogger } from '@components/utils/silent-http-logger.util';
import { faker } from '@faker-js/faker/.';
import { Test, TestingModule } from '@nestjs/testing';
import { disableSystemErrorLoggingForThisTest } from '@testing/tools/utils/disable-system-error-logging.util';
import { RedisClientAdapter } from 'src/common/redis/redis.client.adapter';
import { HttpLoggerModule } from 'src/http-logger/http-logger.module';
import {
    SESS_REDIS_PREFIX,
    SESSIONS_REDIS_CONNECTION,
} from 'src/sessions/constants/sessions.constants';
import { sessionKey } from 'src/sessions/functions/session-key';
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
                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                regenerate: jest.fn(async (cb) => {
                    await redisClient.store(`session:${mockRequest.sessionID}`, {});
                    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                    cb && cb(); // signal success to promisify()
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

    describe('isFullyCleaned', () => {
        describe("Session still exists in user's sessions index", () => {
            test('return false', async () => {
                // create session
                const userId = faker.string.alpha(10);
                const sessId = faker.string.uuid();
                mockRequest.sessionID = sessId;
                await sessionsService.create(<any>mockRequest, userId);
                // delete session
                const sessKey = sessionKey(sessId);
                await redisClient.delete(sessKey);
                // delete user-session relation
                const relationKey = userAndSessionRelationKey(sessId);
                await redisClient.delete(relationKey);
                // still exists in index
                const isFullyCleaned = await sessionIsFullyCleaned({
                    userId,
                    sessId,
                    sessionsService,
                });
                expect(isFullyCleaned).toBeFalsy();
            });
        });

        describe('User-session relation record still exists', () => {
            test('return false', async () => {
                // create session
                const userId = faker.string.alpha(10);
                const sessId = faker.string.uuid();
                mockRequest.sessionID = sessId;
                await sessionsService.create(<any>mockRequest, userId);
                // delete session
                const sessKey = sessionKey(sessId);
                await redisClient.delete(sessKey);
                // delete from index
                const indexKey = userSessionsSetKey(userId);
                await redisClient.setRem(indexKey, sessId);
                // still exists relation
                const isFullyCleaned = await sessionIsFullyCleaned({
                    userId,
                    sessId,
                    sessionsService,
                });
                expect(isFullyCleaned).toBeFalsy();
            });
        });

        describe('Session record still exists', () => {
            test('return false', async () => {
                // create session
                const userId = faker.string.alpha(10);
                const sessId = faker.string.uuid();
                mockRequest.sessionID = sessId;
                await sessionsService.create(<any>mockRequest, userId);
                // delete from index
                const indexKey = userSessionsSetKey(userId);
                await redisClient.setRem(indexKey, sessId);
                // delete user-session relation
                const relationKey = userAndSessionRelationKey(sessId);
                await redisClient.delete(relationKey);
                // still exists session
                const isFullyCleaned = await sessionIsFullyCleaned({
                    userId,
                    sessId,
                    sessionsService,
                });
                expect(isFullyCleaned).toBeFalsy();
            });
        });

        describe("User does not exist in user's sessions index", () => {
            describe('User-session record does not exist', () => {
                describe('Session record does not exist', () => {
                    test('return true', async () => {
                        // create session
                        const userId = faker.string.alpha(10);
                        const sessId = faker.string.uuid();
                        mockRequest.sessionID = sessId;
                        await sessionsService.create(<any>mockRequest, userId);
                        // delete session
                        const sessKey = sessionKey(sessId);
                        await redisClient.delete(sessKey);
                        // delete from index
                        const indexKey = userSessionsSetKey(userId);
                        await redisClient.setRem(indexKey, sessId);
                        // delete user-session relation
                        const relationKey = userAndSessionRelationKey(sessId);
                        await redisClient.delete(relationKey);
                        // check if fully cleaned
                        const isFullyCleaned = await sessionIsFullyCleaned({
                            userId,
                            sessId,
                            sessionsService,
                        });
                        expect(isFullyCleaned).toBeTruthy();
                    });
                });
            });
        });
    });

    describe('trySessionCleanup', () => {
        describe('redis fails', () => {
            test('the method does not throw', async () => {
                disableSystemErrorLoggingForThisTest();
                const redisDeleteMock = jest
                    .spyOn(RedisClientAdapter.prototype, 'delete')
                    .mockRejectedValueOnce(new Error());
                // create session
                const userId = faker.string.alpha(10);
                const sessId = faker.string.uuid();
                mockRequest.sessionID = sessId;
                await sessionsService.create(<any>mockRequest, userId);
                // cleanup
                await sessionsService.trySessionCleanup(<any>mockRequest);
                expect(redisDeleteMock).toHaveBeenCalled();
            });
        });

        test('delete session record', async () => {
            // create session
            const userId = faker.string.alpha(10);
            const sessId = faker.string.uuid();
            mockRequest.sessionID = sessId;
            await sessionsService.create(<any>mockRequest, userId);
            // cleanup
            await sessionsService.trySessionCleanup(<any>mockRequest);
            // session deleted
            const sess = await redisClient.get(sessionKey(sessId));
            expect(sess).toBeNull();
        });

        test("delete session from user's sessions index", async () => {
            // create session
            const userId = faker.string.alpha(10);
            const sessId = faker.string.uuid();
            mockRequest.sessionID = sessId;
            await sessionsService.create(<any>mockRequest, userId);
            // cleanup
            await sessionsService.trySessionCleanup(<any>mockRequest);
            // session not in users's sessions index
            const indexKey = userSessionsSetKey(userId);
            const inSet = await redisClient.setIsMember(indexKey, sessId);
            expect(inSet).toBeFalsy();
        });

        test('delete user-session relation record', async () => {
            // create session
            const userId = faker.string.alpha(10);
            const sessId = faker.string.uuid();
            mockRequest.sessionID = sessId;
            await sessionsService.create(<any>mockRequest, userId);
            // cleanup
            await sessionsService.trySessionCleanup(<any>mockRequest);
            // relation deleted
            const relationKey = userAndSessionRelationKey(sessId);
            const relation = await redisClient.get(relationKey);
            expect(relation).toBeNull();
        });

        test('req.session.destroy is called', async () => {
            const userId = faker.string.alpha(10);
            mockRequest.sessionID = faker.string.uuid();
            await sessionsService.create(<any>mockRequest, userId);
            await sessionsService.trySessionCleanup(<any>mockRequest);
            expect(mockRequest.session.destroy).toHaveBeenCalledTimes(1);
        });
    });

    describe('isDangling', () => {
        describe('Session exists', () => {
            describe('User-session relation record exists', () => {
                describe("Session not in user's sessions index", () => {
                    test('return true', async () => {
                        // create session
                        const userId = faker.string.alpha(10);
                        const sessId = faker.string.uuid();
                        mockRequest.sessionID = sessId;
                        await sessionsService.create(<any>mockRequest, userId);
                        // delete session from index
                        const indexKey = userSessionsSetKey(userId);
                        await redisClient.setRem(indexKey, sessId);
                        // check if dangling
                        const isDangling = await sessionsService.isDangling({ userId, sessId });
                        expect(isDangling).toBeTruthy();
                    });
                });

                describe("User's session index does not exist", () => {
                    test('return true', async () => {
                        // create session
                        const userId = faker.string.alpha(10);
                        const sessId = faker.string.uuid();
                        mockRequest.sessionID = sessId;
                        await sessionsService.create(<any>mockRequest, userId);
                        // delete index
                        const indexKey = userSessionsSetKey(userId);
                        await redisClient.delete(indexKey);
                        // check if dangling
                        const isDangling = await sessionsService.isDangling({ userId, sessId });
                        expect(isDangling).toBeTruthy();
                    });
                });
            });

            describe("Session exists in user's session redis index", () => {
                describe('User-session relation does not exist', () => {
                    test('return true', async () => {
                        // create session
                        const userId = faker.string.alpha(10);
                        const sessId = faker.string.uuid();
                        mockRequest.sessionID = sessId;
                        await sessionsService.create(<any>mockRequest, userId);
                        // delete user-session relation
                        const relationKey = userAndSessionRelationKey(sessId);
                        await redisClient.delete(relationKey);
                        // check if dangling
                        const isDangling = await sessionsService.isDangling({ userId, sessId });
                        expect(isDangling).toBeTruthy();
                    });
                });
            });

            describe("Session does not exist in user's sessions index", () => {
                describe('User-session relation does not exist', () => {
                    test('return true', async () => {
                        // create session
                        const userId = faker.string.alpha(10);
                        const sessId = faker.string.uuid();
                        mockRequest.sessionID = sessId;
                        await sessionsService.create(<any>mockRequest, userId);
                        // delete user-session relation
                        const relationKey = userAndSessionRelationKey(sessId);
                        await redisClient.delete(relationKey);
                        // delete session from index
                        const indexKey = userSessionsSetKey(userId);
                        await redisClient.setRem(indexKey, sessId);
                        // check if dangling
                        const isDangling = await sessionsService.isDangling({ userId, sessId });
                        expect(isDangling).toBeTruthy();
                    });
                });
            });

            describe("Session exists in user's session redis index", () => {
                describe('User-session relation exists', () => {
                    test('return false', async () => {
                        // create session
                        const userId = faker.string.alpha(10);
                        const sessId = faker.string.uuid();
                        mockRequest.sessionID = sessId;
                        await sessionsService.create(<any>mockRequest, userId);
                        // check if dangling
                        const isDangling = await sessionsService.isDangling({ userId, sessId });
                        expect(isDangling).toBeFalsy();
                    });
                });
            });
        });
    });

    describe('create', () => {
        test('req.session.regenerate is called', async () => {
            mockRequest.sessionID = faker.string.uuid();
            await sessionsService.create(<any>mockRequest, 'test-user-id');
            expect(mockRequest.session.regenerate).toHaveBeenCalledTimes(1);
        });

        test('user-sessions index redis set is created', async () => {
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

        test('session-user relation record is created in redis', async () => {
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
        test('number of sessions associated with the user is returned', async () => {
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

    describe('destroy', () => {
        test('req.session.destroy is called', async () => {
            const sess1Id = faker.string.uuid();
            mockRequest.sessionID = sess1Id;
            await sessionsService.destroy(<any>mockRequest);
            expect(mockRequest.session.destroy).toHaveBeenCalledTimes(1);
        });

        test("session is deleted from user's sessions index in redis", async () => {
            // create session
            const userId = faker.string.alpha(10);
            const sessId = faker.string.uuid();
            mockRequest.sessionID = sessId;
            await sessionsService.create(<any>mockRequest, userId);
            // destroy
            await sessionsService.destroy(<any>mockRequest);
            // session not in users's sessions index
            const indexKey = userSessionsSetKey(userId);
            const inSet = await redisClient.setIsMember(indexKey, sessId);
            expect(inSet).toBeFalsy();
        });

        test('user-session redis record is deleted', async () => {
            // create session
            const userId = faker.string.alpha(10);
            const sessId = faker.string.uuid();
            mockRequest.sessionID = sessId;
            await sessionsService.create(<any>mockRequest, userId);
            // destroy
            await sessionsService.destroy(<any>mockRequest);
            // relation deleted
            const relationKey = userAndSessionRelationKey(sessId);
            const relation = await redisClient.get(relationKey);
            expect(relation).toBeNull();
        });
    });

    describe('deleteAll', () => {
        test('req.session.destroy is called', async () => {
            await sessionsService.destroyAll(<any>mockRequest);
            expect(mockRequest.session.destroy).toHaveBeenCalledTimes(1);
        });

        test('every sessions associated with user are deleted from redis', async () => {
            const userId = faker.string.alpha(10);
            mockRequest.session.userId = userId;

            // create sessions
            const sess1Id = faker.string.uuid();
            mockRequest.sessionID = sess1Id;
            await sessionsService.create(<any>mockRequest, userId);

            const sess2Id = faker.string.uuid();
            mockRequest.sessionID = sess2Id;
            await sessionsService.create(<any>mockRequest, userId);

            // sessions created
            await expect(redisClient.get(`${SESS_REDIS_PREFIX}${sess1Id}`)).resolves.not.toBeNull();
            await expect(redisClient.get(`${SESS_REDIS_PREFIX}${sess2Id}`)).resolves.not.toBeNull();

            // sessions deleted
            await sessionsService.destroyAll(<any>mockRequest);
            await expect(redisClient.get(`${SESS_REDIS_PREFIX}${sess1Id}`)).resolves.toBeNull();
            await expect(redisClient.get(`${SESS_REDIS_PREFIX}${sess2Id}`)).resolves.toBeNull();

            // index deleted
            const indexKey = userSessionsSetKey(userId);
            const index = await redisClient.setMembers(indexKey);
            expect(index.length).toBe(0);

            // relations deleted
            await expect(redisClient.get(userAndSessionRelationKey(sess1Id))).resolves.toBeNull();
            await expect(redisClient.get(userAndSessionRelationKey(sess2Id))).resolves.toBeNull();
        });

        test('return the number of the deleted sessions', async () => {
            const userId = faker.string.alpha(10);
            mockRequest.session.userId = userId;

            // create sessions
            const sess1Id = faker.string.uuid();
            mockRequest.sessionID = sess1Id;
            await sessionsService.create(<any>mockRequest, userId);

            const sess2Id = faker.string.uuid();
            mockRequest.sessionID = sess2Id;
            await sessionsService.create(<any>mockRequest, userId);

            const deletedSessions = await sessionsService.destroyAll(<any>mockRequest);
            expect(deletedSessions).toBe(2);
        });
    });
});
