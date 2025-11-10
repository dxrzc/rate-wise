import { faker } from '@faker-js/faker/.';
import { createAccount } from '@integration/utils/create-account.util';
import { getSessionCookie } from '@integration/utils/get-session-cookie.util';
import { getSidFromCookie } from '@integration/utils/get-sid-from-cookie.util';
import { success } from '@integration/utils/no-errors.util';
import { status2xx } from '@integration/utils/status-2xx.util';
import { testKit } from '@integration/utils/test-kit.util';
import { HttpStatus } from '@nestjs/common';
import { signIn } from '@testing/tools/gql-operations/auth/sign-in.operation';
import { findUserById } from '@testing/tools/gql-operations/users/find-by-id.operation';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { THROTTLE_CONFIG } from 'src/common/constants/throttle.config.constants';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';
import { SESS_REDIS_PREFIX } from 'src/sessions/constants/sessions.constants';
import { blacklistTokenKey } from 'src/tokens/functions/blacklist-token-key';
import { createUserCacheKey } from 'src/users/cache/create-key';
import { USER_MESSAGES } from 'src/users/messages/user.messages';

const deleteAccUrl = testKit.endpointsREST.deleteAccount;

describe(`GET ${testKit.endpointsREST.deleteAccount}?token=...`, () => {
    describe('Success', () => {
        test('account should be deleted from database', async () => {
            const { id } = await createAccount();
            const token = await testKit.accDeletionToken.generate({ id });
            await expect(testKit.userRepos.findOneBy({ id })).resolves.not.toBeNull();
            await testKit.restClient.get(`${deleteAccUrl}?token=${token}`).expect(status2xx);
            const userInDb = await testKit.userRepos.findOneBy({ id });
            expect(userInDb).toBeNull();
        });

        test('token should be blacklisted', async () => {
            const { id } = await createAccount();
            const { token, jti } = await testKit.accDeletionToken.generate(
                { id },
                { metadata: true },
            );
            await testKit.restClient.get(`${deleteAccUrl}?token=${token}`).expect(status2xx);
            const redisKey = blacklistTokenKey(jti);
            const tokenInRedis = await testKit.tokensRedisClient.get(redisKey);
            expect(tokenInRedis).not.toBeNull();
        });

        test('sessions associated with user should be removed from Redis', async () => {
            const { sessionCookie: sess1Cookie, password, email, id } = await createAccount(); // sess1
            const signInRes = await testKit.gqlClient // sess2
                .send(signIn({ args: { email, password }, fields: ['id'] }))
                .expect(success);
            const sid1 = getSidFromCookie(sess1Cookie);
            const sid2 = getSidFromCookie(getSessionCookie(signInRes));
            const sid1RedisKey = `${SESS_REDIS_PREFIX}${sid1}`;
            const sid2RedisKey = `${SESS_REDIS_PREFIX}${sid2}`;
            // check both sids exist in redis
            await expect(testKit.sessionsRedisClient.get(sid1RedisKey)).resolves.not.toBeNull();
            await expect(testKit.sessionsRedisClient.get(sid2RedisKey)).resolves.not.toBeNull();
            // delete-account
            const token = await testKit.accDeletionToken.generate({ id });
            await testKit.restClient.get(`${deleteAccUrl}?token=${token}`).expect(status2xx);
            // sids should not exist in Redis anymore
            await expect(testKit.sessionsRedisClient.get(sid1RedisKey)).resolves.toBeNull();
            await expect(testKit.sessionsRedisClient.get(sid2RedisKey)).resolves.toBeNull();
        });

        test('User should be deleted from redis cache', async () => {
            const { id } = await createAccount();
            const cacheKey = createUserCacheKey(id);
            await testKit.gqlClient
                .send(findUserById({ fields: ['id'], args: id }))
                .expect(success); // triggers caching
            await expect(testKit.cacheManager.get(cacheKey)).resolves.toBeDefined();
            const token = await testKit.accDeletionToken.generate({ id }); // delete
            await testKit.restClient.get(`${deleteAccUrl}?token=${token}`).expect(status2xx);
            const userInCache = await testKit.cacheManager.get(cacheKey);
            expect(userInCache).toBeUndefined();
        });
    });

    describe('Account does not exist', () => {
        test(`should return "${HttpStatus.NOT_FOUND}" code and "${USER_MESSAGES.NOT_FOUND}" message`, async () => {
            const { id } = await createAccount();
            const token = await testKit.accDeletionToken.generate({ id });
            await testKit.userRepos.delete(id); // user deleted
            const res = await testKit.restClient.get(`${deleteAccUrl}?token=${token}`);
            expect(res.body).toStrictEqual({ error: USER_MESSAGES.NOT_FOUND });
            expect(res.statusCode).toBe(HttpStatus.NOT_FOUND);
        });
    });

    describe('No token provided', () => {
        test(`return BAD REQUEST status code and "${AUTH_MESSAGES.INVALID_URL}" message`, async () => {
            const res = await testKit.restClient.get(deleteAccUrl);
            expect(res.body.message).toBe(AUTH_MESSAGES.INVALID_URL);
            expect(res.status).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe('Invalid token', () => {
        test(`return BAD REQUEST status code and "${AUTH_MESSAGES.INVALID_TOKEN}" message`, async () => {
            const invalidToken = faker.string.uuid();
            const res = await testKit.restClient.get(`${deleteAccUrl}?token=${invalidToken}`);
            expect(res.body.message).toBe(AUTH_MESSAGES.INVALID_TOKEN);
            expect(res.status).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe('Token for account verification sent', () => {
        test(`return BAD REQUEST status code and "${AUTH_MESSAGES.INVALID_TOKEN}" message`, async () => {
            const { id } = await createAccount();
            // verification token
            const accVerifToken = await testKit.accVerifToken.generate({ id });
            const res = await testKit.restClient.get(`${deleteAccUrl}?token=${accVerifToken}`);
            expect(res.body.message).toBe(AUTH_MESSAGES.INVALID_TOKEN);
            expect(res.status).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe(`More than ${THROTTLE_CONFIG.ULTRA_CRITICAL.limit} attemps in ${THROTTLE_CONFIG.ULTRA_CRITICAL.ttl / 1000}s from the same ip`, () => {
        test(`should return TOO MANY REQUESTS status code and "${COMMON_MESSAGES.TOO_MANY_REQUESTS}" message`, async () => {
            const invalidToken = faker.string.uuid();
            const sameIp = faker.internet.ip();
            const requests = Array.from({ length: THROTTLE_CONFIG.ULTRA_CRITICAL.limit }, () =>
                testKit.restClient
                    .get(`${deleteAccUrl}?token=${invalidToken}`)
                    .set('X-Forwarded-For', sameIp),
            );
            await Promise.all(requests);
            const res = await testKit.restClient.get(deleteAccUrl).set('X-Forwarded-For', sameIp);
            expect(res.body.message).toBe(COMMON_MESSAGES.TOO_MANY_REQUESTS);
            expect(res.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
        });
    });
});
