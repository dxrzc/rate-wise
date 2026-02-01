import { createDisabledLoggerImport } from '@components/imports/create-disabled-logger.import';
import { createGqlImport } from '@components/imports/create-graphql.import';
import { Controller, Get, Req } from '@nestjs/common';
import { Query, Resolver } from '@nestjs/graphql';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { seconds } from '@nestjs/throttler';
import { RequestContext } from 'src/auth/types/request-context.type';
import request from 'supertest';
import { Query as RestQuery } from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from 'src/auth/guards/auth.guard';
import { UsersService } from 'src/users/users.service';
import { SessionsModule } from 'src/sessions/sessions.module';
import { createLightweightRedisContainer } from '@components/utils/create-lightweight-redis.util';
import { SessionMiddlewareFactory } from 'src/sessions/middlewares/session.middleware.factory';
import { SessionsService } from 'src/sessions/sessions.service';
import { User } from 'src/users/entities/user.entity';
import { Code } from 'src/common/enum/code.enum';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { extractSessionIdFromCookie } from '@testing/tools/utils/get-sid-from-cookie.util';
import { userSessionsSetKey } from 'src/sessions/functions/sessions-index-key';
import { userAndSessionRelationKey } from 'src/sessions/functions/user-session-relation-key';
import { sessionIsFullyCleaned } from '@components/utils/session-is-fully-cleaned.util';
import { RedisClientAdapter } from 'src/common/redis/redis.client.adapter';
import { disableSystemErrorLoggingForThisTest } from '@testing/tools/utils/disable-system-error-logging.util';

// Used to test the guard
@Resolver()
export class TestResolver {
    @Query(() => Boolean, { name: 'testQuery' })
    testQuery(): boolean {
        return true;
    }
}
const testOperation = `
query MyQuery {
    testQuery
}`;

// Used to generate a valid session cookie
@Controller('session')
export class SessionGeneratorController {
    constructor(private readonly sessionService: SessionsService) {}

    @Public()
    @Get()
    async createCookie(@Req() req: RequestContext, @RestQuery('userId') userId: string) {
        await this.sessionService.create(req, userId);
    }
}

describe('AuthGuard', () => {
    let testingModule: TestingModule;
    let sessionService: SessionsService;
    let userFound: Partial<User> | undefined = {};
    const usersService = { findOneById: () => userFound };
    const sessionCookieName = 'sess';
    let app: NestExpressApplication;

    beforeAll(async () => {
        const redisUrl = await createLightweightRedisContainer();
        testingModule = await Test.createTestingModule({
            imports: [
                ...createDisabledLoggerImport(),
                ...createGqlImport(),
                SessionsModule.forRootAsync({
                    useFactory: () => ({
                        connection: { redisUri: redisUrl },
                        cookieMaxAgeMs: seconds(3),
                        cookieName: sessionCookieName,
                        cookieSecret: '123',
                        secure: false,
                        sameSite: 'strict',
                    }),
                }),
            ],
            providers: [{ provide: APP_GUARD, useClass: AuthGuard }, TestResolver, UsersService],
            controllers: [SessionGeneratorController],
        })
            .overrideProvider(UsersService)
            .useValue(usersService)
            .compile();
        app = testingModule.createNestApplication({});
        app.useLogger(false);
        app.use(app.get(SessionMiddlewareFactory).create());
        await app.init();
        sessionService = app.get(SessionsService);
    });

    afterAll(async () => {
        await testingModule.close();
    });

    async function generateFullSession(userId: string) {
        const res = await request(app.getHttpServer()).get(`/session?userId=${userId}`);
        const cookie = res.headers['set-cookie'][0];
        return cookie;
    }

    describe('Valid session cookie and user exists', () => {
        test('guard allows access successfully', async () => {
            // mock existing user
            const userId = '123';
            userFound = { id: userId };
            const cookie = await generateFullSession(userId);
            const res = await request(app.getHttpServer())
                .post('/graphql')
                .set('Cookie', cookie)
                .send({ query: testOperation });
            expect(res).notToFail();
        });
    });

    describe('Session cookie not provided', () => {
        describe('User exists', () => {
            test('return unauthorized code and unauthorized error message', async () => {
                // mock existing user
                userFound = { id: '123' };
                const res = await request(app.getHttpServer())
                    .post('/graphql') // sess cookie not set
                    .send({ query: testOperation });
                expect(res).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.UNAUTHORIZED);
            });
        });

        describe('User does not exist', () => {
            test('return unauthorized code and unauthorized error message', async () => {
                // mock existing user
                userFound = undefined;
                const res = await request(app.getHttpServer())
                    .post('/graphql') // sess cookie not set
                    .send({ query: testOperation });
                expect(res).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.UNAUTHORIZED);
            });
        });
    });

    describe('Session is dangling', () => {
        describe('User found', () => {
            test('return unauthorized code and unauthorized error message', async () => {
                // mock existing user
                const userId = '123';
                userFound = { id: userId };
                const cookie = await generateFullSession(userId);
                // delete from user's index
                await sessionService['redisClient'].setRem(
                    userSessionsSetKey(userId),
                    extractSessionIdFromCookie(cookie),
                );
                // authentication attemp
                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Cookie', cookie)
                    .send({ query: testOperation });
                expect(res).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.UNAUTHORIZED);
            });

            test('cleanup session in redis', async () => {
                // mock existing user
                const userId = '123';
                userFound = { id: userId };
                const cookie = await generateFullSession(userId);
                // delete user-session relation
                const sessId = extractSessionIdFromCookie(cookie);
                await sessionService['redisClient'].delete(userAndSessionRelationKey(sessId));
                // authentication attemp
                await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Cookie', cookie)
                    .send({ query: testOperation });
                // session should be fully cleaned
                const isFullyCleaned = await sessionIsFullyCleaned({
                    sessId,
                    userId,
                    sessionsService: sessionService,
                });
                expect(isFullyCleaned).toBeTruthy();
            });

            test('dangling session is fully destroyed', async () => {
                // mock existing user
                const userId = '123';
                userFound = { id: userId };
                const cookie = await generateFullSession(userId);
                // delete user-session relation
                const sessId = extractSessionIdFromCookie(cookie);
                await sessionService['redisClient'].delete(userAndSessionRelationKey(sessId));
                // authentication attemp
                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Cookie', cookie)
                    .send({ query: testOperation });
                // cookie cleared in response
                const setCookieHeader = res.header['set-cookie'];
                expect(setCookieHeader).toBeUndefined();
            });

            describe('Session cleanup fails', () => {
                test('return unauthorized code and unauthorized error message', async () => {
                    disableSystemErrorLoggingForThisTest();
                    // mock existing user
                    const userId = '123';
                    userFound = { id: userId };
                    const cookie = await generateFullSession(userId);
                    // delete user-session relation
                    const sessId = extractSessionIdFromCookie(cookie);
                    await sessionService['redisClient'].delete(userAndSessionRelationKey(sessId));
                    // mock redis delete method to produce an error
                    const redisDeleteMock = jest
                        .spyOn(RedisClientAdapter.prototype, 'delete')
                        .mockRejectedValueOnce(() => new Error());
                    disableSystemErrorLoggingForThisTest();
                    // authentication attemp
                    const res = await request(app.getHttpServer())
                        .post('/graphql')
                        .set('Cookie', cookie)
                        .send({ query: testOperation });
                    expect(redisDeleteMock).toHaveBeenCalled();
                    expect(res).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.UNAUTHORIZED);
                });
            });
        });
    });

    describe('Valid session cookie', () => {
        describe('User not found', () => {
            test('return unauthorized code and unauthorized error message', async () => {
                // mock non-existing user
                userFound = undefined;
                const cookie = await generateFullSession('test-id');
                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Cookie', cookie)
                    .send({ query: testOperation });
                expect(res).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.UNAUTHORIZED);
            });

            test('cleanup session in redis', async () => {
                // mock non-existing user
                userFound = undefined;
                const deletedUserId = 'test-id';
                const cookie = await generateFullSession(deletedUserId);
                // authentication attemp
                await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Cookie', cookie)
                    .send({ query: testOperation });
                // session should be fully cleaned
                const isFullyCleaned = await sessionIsFullyCleaned({
                    userId: deletedUserId,
                    sessId: extractSessionIdFromCookie(cookie),
                    sessionsService: sessionService,
                });
                expect(isFullyCleaned).toBeTruthy();
            });

            test('zombie session is fully destroyed', async () => {
                // mock non-existing user
                userFound = undefined;
                const deletedUserId = 'test-id';
                const cookie = await generateFullSession(deletedUserId);
                // authentication attemp
                const res = await request(app.getHttpServer())
                    .post('/graphql')
                    .set('Cookie', cookie)
                    .send({ query: testOperation });
                // cookie cleared in response
                const setCookieHeader = res.header['set-cookie'];
                expect(setCookieHeader).toBeUndefined();
            });

            describe('Session cleanup fails', () => {
                test('return unauthorized code and unauthorized error message', async () => {
                    disableSystemErrorLoggingForThisTest();
                    // mock non-existing user and generate valid session (zombie session)
                    userFound = undefined;
                    const deletedUserId = 'test-id';
                    const cookie = await generateFullSession(deletedUserId);
                    // mock redis delete method to produce an error
                    const redisDeleteMock = jest
                        .spyOn(RedisClientAdapter.prototype, 'delete')
                        .mockRejectedValueOnce(() => new Error());
                    disableSystemErrorLoggingForThisTest();
                    // authentication attemp
                    const res = await request(app.getHttpServer())
                        .post('/graphql')
                        .set('Cookie', cookie)
                        .send({ query: testOperation });
                    expect(redisDeleteMock).toHaveBeenCalled();
                    expect(res).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.UNAUTHORIZED);
                });
            });
        });
    });
});
