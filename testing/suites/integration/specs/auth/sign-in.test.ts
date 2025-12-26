import { faker } from '@faker-js/faker/.';
import { createAccount } from '@integration/utils/create-account.util';
import { getSessionCookie } from '@integration/utils/get-session-cookie.util';
import { getSidFromCookie } from '@integration/utils/get-sid-from-cookie.util';
import { success } from '@integration/utils/no-errors.util';
import { testKit } from '@integration/utils/test-kit.util';
import { signIn } from '@testing/tools/gql-operations/auth/sign-in.operation';
import { AUTH_LIMITS } from 'src/auth/constants/auth.constants';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { THROTTLE_CONFIG } from 'src/common/constants/throttle.config.constants';
import { Code } from 'src/common/enum/code.enum';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';
import { userSessionsSetKey } from 'src/sessions/functions/sessions-index-key';
import { userAndSessionRelationKey } from 'src/sessions/functions/user-session-relation-key';

describe('GraphQL - signIn', () => {
    describe('Successful sign in', () => {
        test('session cookie is set in headers', async () => {
            const { email, password } = await createAccount();
            const res = await testKit.gqlClient
                .send(signIn({ args: { email, password }, fields: ['id'] }))
                .expect(success);
            expect(res).toContainCookie(testKit.authConfig.sessCookieName);
        });

        test('new session is added to the user sessions index redis set', async () => {
            const { email, password } = await createAccount();
            const res = await testKit.gqlClient
                .send(signIn({ args: { email, password }, fields: ['id'] }))
                .expect(success);
            const key = userSessionsSetKey(res.body.data.signIn.id);
            const sessId = getSidFromCookie(getSessionCookie(res));
            const sessSet = await testKit.sessionsRedisClient.setMembers(key);
            expect(sessSet.length).toBe(2); // signUp and signIn
            expect(sessSet.find((key) => key === sessId)).toBeDefined();
        });

        test('session-user relation record is created in redis', async () => {
            const { email, password } = await createAccount();
            const res = await testKit.gqlClient
                .send(signIn({ args: { email, password }, fields: ['id'] }))
                .expect(success);
            const sid = getSidFromCookie(getSessionCookie(res));
            const key = userAndSessionRelationKey(sid);
            const sessionOwner = await testKit.sessionsRedisClient.get(key);
            expect(sessionOwner).toBe(res.body.data.signIn.id);
        });

        test('returned data match user data in database', async () => {
            const { email, password, id } = await createAccount();
            const res = await testKit.gqlClient.send(
                signIn({ args: { email, password }, fields: 'ALL' }),
            );
            const userDb = await testKit.userRepos.findOneByOrFail({ id });
            expect(res.body.data.signIn).toStrictEqual({
                username: userDb?.username,
                createdAt: userDb?.createdAt.toISOString(),
                updatedAt: userDb?.updatedAt.toISOString(),
                email: userDb?.email,
                status: userDb?.status.toUpperCase(),
                roles: userDb?.roles.map((role) => role.toUpperCase()),
                id: userDb?.id,
            });
        });

        describe('Session cookie is provided', () => {
            test('old session is removed from redis store (session rotation)', async () => {
                const { sessionCookie, email, password } = await createAccount();
                const oldSid = getSidFromCookie(sessionCookie);
                await testKit.gqlClient
                    .set('Cookie', sessionCookie)
                    .send(signIn({ args: { email, password }, fields: ['id'] }))
                    .expect(success);
                const oldSessionKey = `session:${oldSid}`;
                await expect(testKit.sessionsRedisClient.get(oldSessionKey)).resolves.toBeNull();
            });
        });
    });

    describe('Password is too long', () => {
        test('return unauthorized code and invalid credentials error message', async () => {
            const password = faker.internet.password({ length: AUTH_LIMITS.PASSWORD.MAX + 1 });
            const res = await testKit.gqlClient.send(
                signIn({
                    args: { email: testKit.userSeed.email, password: password },
                    fields: ['id'],
                }),
            );
            expect(res).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.INVALID_CREDENTIALS);
        });
    });

    describe('Password does not match', () => {
        test('return unauthorized code and invalid credentials error message', async () => {
            const { email } = await createAccount();
            const res = await testKit.gqlClient.send(
                signIn({
                    args: { email, password: testKit.userSeed.password },
                    fields: ['id'],
                }),
            );
            expect(res).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.INVALID_CREDENTIALS);
        });
    });

    describe('Email not provided', () => {
        test('return bad user input code', async () => {
            const res = await testKit.gqlClient.send(
                signIn({
                    args: { password: testKit.userSeed.password, email: undefined as any },
                    fields: ['id'],
                }),
            );
            expect(res).toFailWith(Code.BAD_USER_INPUT, expect.stringContaining('email'));
        });
    });

    describe('Password not provided', () => {
        test('return bad user input code', async () => {
            const res = await testKit.gqlClient.send(
                signIn({
                    args: { email: testKit.userSeed.email, password: undefined as any },
                    fields: ['id'],
                }),
            );
            expect(res).toFailWith(Code.BAD_USER_INPUT, expect.stringContaining('password'));
        });
    });

    describe('User in email does not exist', () => {
        test('return unauthorized code and invalid credentials error message', async () => {
            const res = await testKit.gqlClient.send(
                signIn({
                    args: { email: testKit.userSeed.email, password: testKit.userSeed.password },
                    fields: ['id'],
                }),
            );
            expect(res).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.INVALID_CREDENTIALS);
        });
    });

    describe('User exceeds the maximum active sessions', () => {
        test('return forbidden code and max sessions reached error message', async () => {
            const maxSessions = testKit.authConfig.maxUserSessions;
            const { email, password } = await createAccount(); // 1 session
            const signInPromises = Array.from({ length: maxSessions - 1 }, () =>
                testKit.gqlClient
                    .send(signIn({ args: { email, password }, fields: ['id'] }))
                    .expect(success),
            );
            await Promise.all(signInPromises);
            const res = await testKit.gqlClient.send(
                signIn({ args: { email, password }, fields: ['id'] }),
            );
            expect(res).toFailWith(Code.FORBIDDEN, AUTH_MESSAGES.MAX_SESSIONS_REACHED);
        });
    });

    describe('Attempt to fetch password', () => {
        test('return graphql validation failed code', async () => {
            const { email, password } = await createAccount();
            const res = await testKit.gqlClient.send(
                signIn({ args: { email, password }, fields: ['password' as any] }),
            );
            expect(res).toFailWith(
                Code.GRAPHQL_VALIDATION_FAILED,
                expect.stringContaining('password'),
            );
        });
    });

    describe('More than allowed attempts from same ip', () => {
        test('return too many requests code and too many requests error message', async () => {
            const ip = faker.internet.ip();
            const requests = Array.from({ length: THROTTLE_CONFIG.CRITICAL.limit }, () =>
                testKit.gqlClient
                    .set('X-Forwarded-For', ip)
                    .send(signIn({ args: { email: '', password: '' }, fields: ['id'] })),
            );
            await Promise.all(requests);
            const res = await testKit.gqlClient
                .set('X-Forwarded-For', ip)
                .send(signIn({ args: { email: '', password: '' }, fields: ['id'] }));
            expect(res).toFailWith(Code.TOO_MANY_REQUESTS, COMMON_MESSAGES.TOO_MANY_REQUESTS);
        });
    });
});
