import { faker } from '@faker-js/faker/.';
import { createAccount } from '@integration/utils/create-account.util';
import { isSessionCookieCleared } from '@integration/utils/is-session-cookie-cleared.util';
import { getSidFromCookie } from '@integration/utils/get-sid-from-cookie.util';
import { success } from '@integration/utils/no-errors.util';
import { testKit } from '@integration/utils/test-kit.util';
import { signOut } from '@testing/tools/gql-operations/auth/sign-out.operation';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { RATE_LIMIT_PROFILES } from 'src/common/rate-limit/rate-limit.profiles';
import { Code } from 'src/common/enums/code.enum';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';
import { SESS_REDIS_PREFIX } from 'src/sessions/di/sessions.providers';
import { createUserSessionsSetKey } from 'src/sessions/keys/create-sessions-index-key';
import { createSessionAndUserMappingKey } from 'src/sessions/keys/create-session-and-user-mapping-key';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { UserRole } from 'src/users/enums/user-role.enum';

describe('GraphQL - signOut', () => {
    describe('Session cookie not provided', () => {
        test('return unauthorized code and unauthorized error message', async () => {
            const res = await testKit.gqlClient.send(signOut());
            expect(res).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.UNAUTHORIZED);
        });
    });

    describe.each(Object.values(AccountStatus))('User account status is %s', (status) => {
        test('user can perform this action', async () => {
            const { sessionCookie } = await createAccount({ status });
            await testKit.gqlClient.set('Cookie', sessionCookie).send(signOut()).expect(success);
        });
    });

    describe.each(Object.values(UserRole))('User roles are: [%s]', (role: UserRole) => {
        test('user can perform this action', async () => {
            const { sessionCookie } = await createAccount({
                roles: [role],
            });
            await testKit.gqlClient.set('Cookie', sessionCookie).send(signOut()).expect(success);
        });
    });

    describe('Successful signOut', () => {
        test('session cookie is removed from Redis store', async () => {
            const { sessionCookie } = await createAccount();
            await testKit.gqlClient.set('Cookie', sessionCookie).send(signOut()).expect(success);
            const redisKey = `${SESS_REDIS_PREFIX}${getSidFromCookie(sessionCookie)}`;
            const sessInRedis = await testKit.sessionsRedisClient.get(redisKey);
            expect(sessInRedis).toBeNull();
        });

        test('user-session relation record is removed from redis', async () => {
            const { sessionCookie } = await createAccount();
            const sid = getSidFromCookie(sessionCookie);
            const relationKey = createSessionAndUserMappingKey(sid);
            // relation exists
            await expect(testKit.sessionsRedisClient.get(relationKey)).resolves.not.toBeNull();
            // sign out
            await testKit.gqlClient.set('Cookie', sessionCookie).send(signOut()).expect(success);
            // relation does not exist anymore
            await expect(testKit.sessionsRedisClient.get(relationKey)).resolves.toBeNull();
        });

        test('session id is removed from user-sessions redis set', async () => {
            const { sessionCookie, id } = await createAccount();
            const sid = getSidFromCookie(sessionCookie);
            const setKey = createUserSessionsSetKey(id);
            // sid in set
            await expect(
                testKit.sessionsRedisClient.setIsMember(setKey, sid),
            ).resolves.toBeTruthy();
            // sign out
            await testKit.gqlClient.set('Cookie', sessionCookie).send(signOut()).expect(success);
            // sid not in set anymore
            await expect(testKit.sessionsRedisClient.setIsMember(setKey, sid)).resolves.toBeFalsy();
        });

        test('session cookie is cleared in response', async () => {
            const { sessionCookie } = await createAccount();
            // logout
            const res = await testKit.gqlClient
                .set('Cookie', sessionCookie)
                .send(signOut())
                .expect(success);
            const cookieInRes = isSessionCookieCleared(res);
            expect(cookieInRes).toBeTruthy();
        });
    });

    describe('More than allowed attempts from same ip', () => {
        test('return too many requests code and too many requests error message', async () => {
            const ip = faker.internet.ip();
            await Promise.all(
                Array.from({ length: RATE_LIMIT_PROFILES.CRITICAL.limit }, () =>
                    testKit.gqlClient.set('X-Forwarded-For', ip).send(signOut()),
                ),
            );
            const res = await testKit.gqlClient.set('X-Forwarded-For', ip).send(signOut());
            expect(res).toFailWith(Code.TOO_MANY_REQUESTS, COMMON_MESSAGES.TOO_MANY_REQUESTS);
        });
    });
});
