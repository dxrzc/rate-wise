import { faker } from '@faker-js/faker';
import { createAccount } from '@integration/utils/create-account.util';
import { getSessionCookie } from '@integration/utils/get-session-cookie.util';
import { getSidFromCookie } from '@integration/utils/get-sid-from-cookie.util';
import { success } from '@integration/utils/no-errors.util';
import { status2xx } from '@integration/utils/status-2xx.util';
import { testKit } from '@integration/utils/test-kit.util';
import { HttpStatus } from '@nestjs/common';
import { signIn } from '@testing/tools/gql-operations/auth/sign-in.operation';
import { disableSystemErrorLoggingForThisTest } from '@testing/tools/utils/disable-system-error-logging.util';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { RATE_LIMIT_PROFILES } from 'src/common/rate-limit/rate-limit.profiles';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';
import { SESS_REDIS_PREFIX } from 'src/sessions/di/sessions.providers';
import { createUserSessionsSetKey } from 'src/sessions/keys/create-sessions-index-key';
import { createSessionAndUserMappingKey } from 'src/sessions/keys/create-session-and-user-mapping-key';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { UserRole } from 'src/users/enums/user-role.enum';
import { USER_MESSAGES } from 'src/users/messages/user.messages';
import { createSessionKey } from 'src/sessions/keys/create-session-key';
import { createBlacklistTokenKey } from 'src/tokens/keys/create-blacklist-token-key';
import { RedisClientAdapter } from 'src/redis/client/redis.client.adapter';

const signOutAllUrl = testKit.endpointsREST.signOutAll;

describe('GET sign-out-all (public)', () => {
    describe.each(Object.values(AccountStatus))('User account status is %s', (status) => {
        test('user can perform this action', async () => {
            const { id } = await createAccount({ status });
            const token = await testKit.signOutAllToken.generate({ id });
            await expect(testKit.userRepos.findOneBy({ id })).resolves.not.toBeNull();
            await testKit.restClient.get(`${signOutAllUrl}?token=${token}`).expect(status2xx);
        });
    });

    describe('User not found', () => {
        test('return not found code and not found error message', async () => {
            const { id } = await createAccount();
            const token = await testKit.signOutAllToken.generate({ id });
            await testKit.userRepos.delete(id); // user deleted
            const res = await testKit.restClient.get(`${signOutAllUrl}?token=${token}`);
            expect(res.body).toStrictEqual({ error: USER_MESSAGES.NOT_FOUND });
            expect(res.statusCode).toBe(HttpStatus.NOT_FOUND);
        });
    });

    describe.each(Object.values(UserRole))('User roles are: [%s]', (role: UserRole) => {
        test('user can perform this action', async () => {
            const { id } = await createAccount({
                roles: [role],
            });
            const token = await testKit.signOutAllToken.generate({ id });
            await expect(testKit.userRepos.findOneBy({ id })).resolves.not.toBeNull();
            await testKit.restClient.get(`${signOutAllUrl}?token=${token}`).expect(status2xx);
        });
    });

    describe('Success', () => {
        test('token is blacklisted', async () => {
            const { id } = await createAccount();
            const { token, jti } = await testKit.signOutAllToken.generate(
                { id },
                { metadata: true },
            );
            await testKit.restClient.get(`${signOutAllUrl}?token=${token}`).expect(status2xx);
            const redisKey = createBlacklistTokenKey(jti);
            const tokenInRedis = await testKit.tokensRedisClient.get(redisKey);
            expect(tokenInRedis).not.toBeNull();
        });

        test('delete user-sessions redis set', async () => {
            const { id } = await createAccount();
            // set exists
            const redisKey = createUserSessionsSetKey(id);
            await expect(testKit.sessionsRedisClient.exists(redisKey)).resolves.toBeTruthy();
            // sign-out-all
            const token = await testKit.signOutAllToken.generate({ id });
            await testKit.restClient.get(`${signOutAllUrl}?token=${token}`).expect(status2xx);
            // set does not exist anymore
            await expect(testKit.sessionsRedisClient.exists(redisKey)).resolves.toBeFalsy();
        });

        test('delete all user sessions from redis', async () => {
            // get session-cookie 1
            const { sessionCookie: sess1Cookie, password, email, id } = await createAccount();
            // get session-cookie 2
            const signInRes = await testKit.gqlClient // sess2
                .send(signIn({ args: { email, password }, fields: ['id'] }))
                .expect(success);
            const sid1RedisKey = `${SESS_REDIS_PREFIX}${getSidFromCookie(sess1Cookie)}`;
            const sid2RedisKey = `${SESS_REDIS_PREFIX}${getSidFromCookie(getSessionCookie(signInRes))}`;
            // sessions exist in redis
            await expect(testKit.sessionsRedisClient.get(sid1RedisKey)).resolves.not.toBeNull();
            await expect(testKit.sessionsRedisClient.get(sid2RedisKey)).resolves.not.toBeNull();
            // sign-out-all
            const token = await testKit.signOutAllToken.generate({ id });
            await testKit.restClient.get(`${signOutAllUrl}?token=${token}`).expect(status2xx);
            // sessions do not exist anymore
            await expect(testKit.sessionsRedisClient.get(sid1RedisKey)).resolves.toBeNull();
            await expect(testKit.sessionsRedisClient.get(sid2RedisKey)).resolves.toBeNull();
        });

        test('delete all user-session relation records from redis', async () => {
            const { sessionCookie: sess1Cookie, password, email, id } = await createAccount();
            // get session-cookie 2
            const signInRes = await testKit.gqlClient // sess2
                .send(signIn({ args: { email, password }, fields: ['id'] }))
                .expect(success);
            const sess1ID = getSidFromCookie(sess1Cookie);
            const sess2ID = getSidFromCookie(getSessionCookie(signInRes));
            const relation1Key = createSessionAndUserMappingKey(sess1ID);
            const relation2Key = createSessionAndUserMappingKey(sess2ID);
            // relations exist in redis
            await expect(testKit.sessionsRedisClient.get(relation1Key)).resolves.not.toBeNull();
            await expect(testKit.sessionsRedisClient.get(relation2Key)).resolves.not.toBeNull();
            // sign-out-all
            const token = await testKit.signOutAllToken.generate({ id });
            await testKit.restClient.get(`${signOutAllUrl}?token=${token}`).expect(status2xx);
            // relations do not exist anymore
            await expect(testKit.sessionsRedisClient.get(relation1Key)).resolves.toBeNull();
            await expect(testKit.sessionsRedisClient.get(relation2Key)).resolves.toBeNull();
        });
    });

    describe('No token provided ', () => {
        test('return bad request status code and invalid url error message', async () => {
            const res = await testKit.restClient.get(signOutAllUrl);
            expect(res.body).toStrictEqual({ error: AUTH_MESSAGES.INVALID_URL });
            expect(res.status).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe('Invalid token', () => {
        test('return unauthorized status code and invalid token error message', async () => {
            const invalidToken = faker.string.uuid();
            const res = await testKit.restClient.get(`${signOutAllUrl}?token=${invalidToken}`);
            expect(res.body).toStrictEqual({ error: AUTH_MESSAGES.INVALID_TOKEN });
            expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
        });
    });

    describe('Token used twice', () => {
        test('return unauthorized status code and invalid token error message', async () => {
            const { id } = await createAccount();
            const token = await testKit.signOutAllToken.generate({ id });
            // first use
            await testKit.restClient.get(`${signOutAllUrl}?token=${token}`).expect(status2xx);
            // second use
            const res = await testKit.restClient.get(`${signOutAllUrl}?token=${token}`);
            expect(res.body).toStrictEqual({ error: AUTH_MESSAGES.INVALID_TOKEN });
            expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
        });
    });

    describe('Token for account deletion sent', () => {
        test('return unauthorized status code and invalid token error message', async () => {
            const { id } = await createAccount();
            // verification token
            const accVerifToken = await testKit.accDeletionToken.generate({ id });
            const res = await testKit.restClient.get(`${signOutAllUrl}?token=${accVerifToken}`);
            expect(res.body).toStrictEqual({ error: AUTH_MESSAGES.INVALID_TOKEN });
            expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
        });
    });

    describe('Token for account verification sent', () => {
        test('return unauthorized status code and invalid token error message', async () => {
            const { id } = await createAccount();
            // verification token
            const accVerifToken = await testKit.accVerifToken.generate({ id });
            const res = await testKit.restClient.get(`${signOutAllUrl}?token=${accVerifToken}`);
            expect(res.body).toStrictEqual({ error: AUTH_MESSAGES.INVALID_TOKEN });
            expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
        });
    });

    describe('More than allowed attempts from the same ip', () => {
        test('return too many requests code and too many requests error message', async () => {
            const invalidToken = faker.string.uuid();
            const sameIp = faker.internet.ip();
            const requests = Array.from({ length: RATE_LIMIT_PROFILES.ULTRA_CRITICAL.limit }, () =>
                testKit.restClient
                    .get(`${signOutAllUrl}?token=${invalidToken}`)
                    .set('X-Forwarded-For', sameIp),
            );
            await Promise.all(requests);
            const res = await testKit.restClient.get(signOutAllUrl).set('X-Forwarded-For', sameIp);
            expect(res.body).toStrictEqual({ error: COMMON_MESSAGES.TOO_MANY_REQUESTS });
            expect(res.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
        });
    });

    describe('Token blacklisting fails', () => {
        test('unsuccessful request and sessions are NOT deleted', async () => {
            disableSystemErrorLoggingForThisTest();
            const { id, sessionCookie } = await createAccount();
            const { token } = await testKit.signOutAllToken.generate({ id }, { metadata: true });
            // mock to throw an error
            const redisMock = jest
                .spyOn(RedisClientAdapter.prototype, 'store')
                .mockRejectedValueOnce(new Error());
            // sign out all attempt
            await testKit.restClient.get(`${signOutAllUrl}?token=${token}`).expect(500);
            expect(redisMock).toHaveBeenCalledTimes(1);
            // session is not deleted
            const sid = getSidFromCookie(sessionCookie);
            const indexKey = createUserSessionsSetKey(id);
            const relationKey = createSessionAndUserMappingKey(sid);
            const sessKey = createSessionKey(sid);
            const inIndex = await testKit.sessionsRedisClient.setIsMember(indexKey, sid);
            const relation = await testKit.sessionsRedisClient.get(relationKey);
            const session = await testKit.sessionsRedisClient.get(sessKey);
            expect(inIndex).toBeTruthy();
            expect(relation).not.toBeNull();
            expect(session).not.toBeNull();
        });
    });
});
