import { signOutAll } from '@testing/tools/gql-operations/auth/sign-out-all.operation';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';
import { createAccount } from '@integration/utils/create-account.util';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { AUTH_LIMITS } from 'src/auth/constants/auth.constants';
import { testKit } from '@integration/utils/test-kit.util';
import { Code } from 'src/common/enum/code.enum';
import { faker } from '@faker-js/faker/.';
import { THROTTLE_CONFIG } from 'src/common/constants/throttle.config.constants';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { UserRole } from 'src/users/enums/user-role.enum';
import { success } from '@integration/utils/no-errors.util';
import { signIn } from '@testing/tools/gql-operations/auth/sign-in.operation';
import { getSidFromCookie } from '@integration/utils/get-sid-from-cookie.util';
import { getSessionCookie } from '@integration/utils/get-session-cookie.util';
import { SESS_REDIS_PREFIX } from 'src/sessions/constants/sessions.constants';
import { userSessionsSetKey } from 'src/sessions/functions/sessions-index-key';
import { userAndSessionRelationKey } from 'src/sessions/functions/user-session-relation-key';

describe('GraphQL - signOutAll', () => {
    describe('Session Cookie not provided', () => {
        test('return unauthorized code and unauthorized error message', async () => {
            const res = await testKit.gqlClient.send(
                signOutAll({ args: { password: 'password' } }),
            );
            expect(res).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.UNAUTHORIZED);
        });
    });

    describe.each(Object.values(AccountStatus))('User account status is %s', (status) => {
        test('user can perform this action', async () => {
            const { sessionCookie, password } = await createAccount({ status });
            await testKit.gqlClient
                .set('Cookie', sessionCookie)
                .send(signOutAll({ args: { password } }))
                .expect(success);
        });
    });

    describe.each(Object.values(UserRole))('User roles are: [%s]', (role: UserRole) => {
        test('user can perform this action', async () => {
            const { sessionCookie, password } = await createAccount({
                roles: [role],
            });
            await testKit.gqlClient
                .set('Cookie', sessionCookie)
                .send(signOutAll({ args: { password } }))
                .expect(success);
        });
    });

    describe('Successful', () => {
        test('delete all user sessions from redis', async () => {
            // get session-cookie 1
            const { sessionCookie: sess1Cookie, password, email } = await createAccount();
            // get session-cookie 2
            const signInRes = await testKit.gqlClient // sess2
                .send(signIn({ args: { email, password }, fields: ['id'] }))
                .expect(success);
            const sid1RedisKey = `${SESS_REDIS_PREFIX}${getSidFromCookie(sess1Cookie)}`;
            const sid2RedisKey = `${SESS_REDIS_PREFIX}${getSidFromCookie(getSessionCookie(signInRes))}`;
            // sessions exist in redis
            await expect(testKit.sessionsRedisClient.get(sid1RedisKey)).resolves.not.toBeNull();
            await expect(testKit.sessionsRedisClient.get(sid2RedisKey)).resolves.not.toBeNull();
            // sign out all
            await testKit.gqlClient
                .set('Cookie', sess1Cookie)
                .send(signOutAll({ args: { password } }))
                .expect(success);
            // sessions do not exist anymore
            await expect(testKit.sessionsRedisClient.get(sid1RedisKey)).resolves.toBeNull();
            await expect(testKit.sessionsRedisClient.get(sid2RedisKey)).resolves.toBeNull();
        });

        test('delete user-sessions redis set', async () => {
            const { sessionCookie, password, id } = await createAccount();
            // set exists
            const redisKey = userSessionsSetKey(id);
            await expect(testKit.sessionsRedisClient.exists(redisKey)).resolves.toBeTruthy();
            // sign out all
            await testKit.gqlClient
                .set('Cookie', sessionCookie)
                .send(signOutAll({ args: { password } }))
                .expect(success);
            // set does not exist anymore
            await expect(testKit.sessionsRedisClient.exists(redisKey)).resolves.toBeFalsy();
        });

        test('delete all user-session relation records from redis', async () => {
            const { sessionCookie: sess1Cookie, password, email } = await createAccount();
            // get session-cookie 2
            const signInRes = await testKit.gqlClient // sess2
                .send(signIn({ args: { email, password }, fields: ['id'] }))
                .expect(success);
            const sess1ID = getSidFromCookie(sess1Cookie);
            const sess2ID = getSidFromCookie(getSessionCookie(signInRes));
            const relation1Key = userAndSessionRelationKey(sess1ID);
            const relation2Key = userAndSessionRelationKey(sess2ID);
            // relations exist in redis
            await expect(testKit.sessionsRedisClient.get(relation1Key)).resolves.not.toBeNull();
            await expect(testKit.sessionsRedisClient.get(relation2Key)).resolves.not.toBeNull();
            // sign out all
            await testKit.gqlClient
                .set('Cookie', sess1Cookie)
                .send(signOutAll({ args: { password } }))
                .expect(success);
            // relations do not exist anymore
            await expect(testKit.sessionsRedisClient.get(relation1Key)).resolves.toBeNull();
            await expect(testKit.sessionsRedisClient.get(relation2Key)).resolves.toBeNull();
        });
    });

    describe('Password not provided', () => {
        test('return bad user input code', async () => {
            const { sessionCookie } = await createAccount();
            const res = await testKit.gqlClient
                .set('Cookie', sessionCookie)
                .send(signOutAll({ args: { password: undefined as any } }));
            expect(res).toFailWith(Code.BAD_USER_INPUT, expect.stringContaining('password'));
        });
    });

    describe('Password too long', () => {
        test('return unauthorized code and invalid credentials error message', async () => {
            const longPassword = faker.internet.password({
                length: AUTH_LIMITS.PASSWORD.MAX + 1,
            });
            const { sessionCookie } = await createAccount();
            const res = await testKit.gqlClient
                .set('Cookie', sessionCookie)
                .send(signOutAll({ args: { password: longPassword } }));
            expect(res).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.INVALID_CREDENTIALS);
        });
    });

    describe('Password does not match', () => {
        test('return unauthorized code and invalid credentials error message', async () => {
            const { sessionCookie } = await createAccount();
            const res = await testKit.gqlClient
                .set('Cookie', sessionCookie)
                .send(signOutAll({ args: { password: 'password' } }));
            expect(res).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.INVALID_CREDENTIALS);
        });
    });

    describe('More than allowed attempts from same ip', () => {
        test('return too many requests code and too many requests error message', async () => {
            const ip = faker.internet.ip();
            const requests = Array.from({ length: THROTTLE_CONFIG.ULTRA_CRITICAL.limit }, () =>
                testKit.gqlClient
                    .set('X-Forwarded-For', ip)
                    .send(signOutAll({ args: { password: testKit.userSeed.password } })),
            );
            await Promise.all(requests);
            const res = await testKit.gqlClient.set('X-Forwarded-For', ip).send(
                signOutAll({
                    args: { password: testKit.userSeed.password },
                }),
            );
            expect(res).toFailWith(Code.TOO_MANY_REQUESTS, COMMON_MESSAGES.TOO_MANY_REQUESTS);
        });
    });
});
