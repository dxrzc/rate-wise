import { faker } from '@faker-js/faker/.';
import { createAccount } from '@integration/utils/create-account.util';
import { success } from '@integration/utils/no-errors.util';
import { status2xx } from '@integration/utils/status-2xx.util';
import { testKit } from '@integration/utils/test-kit.util';
import { HttpStatus } from '@nestjs/common';
import { findUserById } from '@testing/tools/gql-operations/users/find-by-id.operation';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { THROTTLE_CONFIG } from 'src/common/constants/throttle.config.constants';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';
import { blacklistTokenKey } from 'src/tokens/functions/blacklist-token-key';
import { createUserCacheKey } from 'src/users/cache/create-key';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { USER_MESSAGES } from 'src/users/messages/user.messages';

const verifyAccountUrl = testKit.endpointsREST.verifyAccount;

describe(`GET ${verifyAccountUrl}?token=...`, () => {
    describe('Account successfully verified', () => {
        test('account status should be updated to ACTIVE', async () => {
            const { id } = await createAccount();
            const token = await testKit.accVerifToken.generate({ id });
            const res = await testKit.restClient.get(`${verifyAccountUrl}?token=${token}`);
            const userInDb = await testKit.userRepos.findOneBy({ id });
            expect(res.status).toBe(HttpStatus.OK);
            expect(userInDb?.status).toBe(AccountStatus.ACTIVE);
        });

        test('token should be blacklisted', async () => {
            const { id } = await createAccount();
            const { token, jti } = await testKit.accVerifToken.generate({ id }, { metadata: true });
            const res = await testKit.restClient.get(`${verifyAccountUrl}?token=${token}`);
            const redisKey = blacklistTokenKey(jti);
            const isBlacklisted = await testKit.tokensRedisClient.get(redisKey);
            expect(res.status).toBe(HttpStatus.OK);
            expect(isBlacklisted).toBe(1);
        });

        test('User should be deleted from redis cache', async () => {
            const { id } = await createAccount();
            const cacheKey = createUserCacheKey(id);
            // trigger caching
            await testKit.gqlClient
                .send(findUserById({ fields: ['id'], args: id }))
                .expect(success);
            await expect(testKit.cacheManager.get(cacheKey)).resolves.toBeDefined();
            // verify account
            const token = await testKit.accVerifToken.generate({ id });
            await testKit.restClient.get(`${verifyAccountUrl}?token=${token}`).expect(status2xx);
            const userInCache = await testKit.cacheManager.get(cacheKey);
            expect(userInCache).toBeUndefined();
        });
    });

    describe('Account does not exist', () => {
        test(`should return "${HttpStatus.NOT_FOUND}" code and "${USER_MESSAGES.NOT_FOUND}" message`, async () => {
            const { id } = await createAccount();
            const token = await testKit.accVerifToken.generate({ id });
            await testKit.userRepos.delete(id); // user deleted
            const res = await testKit.restClient.get(`${verifyAccountUrl}?token=${token}`);
            expect(res.body).toStrictEqual({ error: USER_MESSAGES.NOT_FOUND });
            expect(res.statusCode).toBe(HttpStatus.NOT_FOUND);
        });
    });

    describe('No token provided', () => {
        test(`return BAD REQUEST status code and "${AUTH_MESSAGES.INVALID_URL}" message`, async () => {
            const res = await testKit.restClient.get(verifyAccountUrl);
            expect(res.body).toStrictEqual({ error: AUTH_MESSAGES.INVALID_URL });
            expect(res.status).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe('Invalid token', () => {
        test(`return BAD REQUEST status code and "${AUTH_MESSAGES.INVALID_TOKEN}" message`, async () => {
            const invalidToken = faker.string.uuid();
            const res = await testKit.restClient.get(`${verifyAccountUrl}?token=${invalidToken}`);
            expect(res.body).toStrictEqual({ error: AUTH_MESSAGES.INVALID_TOKEN });
            expect(res.status).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe('Token for account deletetion sent', () => {
        test(`return BAD REQUEST status code and "${AUTH_MESSAGES.INVALID_TOKEN}" message`, async () => {
            const { id } = await createAccount();
            // account-deletion token
            const accDeletionToken = await testKit.accDeletionToken.generate({ id });
            const res = await testKit.restClient.get(
                `${verifyAccountUrl}?token=${accDeletionToken}`,
            );
            expect(res.body).toStrictEqual({ error: AUTH_MESSAGES.INVALID_TOKEN });
            expect(res.status).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe('Target account is suspended', () => {
        test(`return FORBIDDEN status code and "${AUTH_MESSAGES.ACCOUNT_IS_SUSPENDED}" message`, async () => {
            const { id } = await createAccount({ status: AccountStatus.SUSPENDED });
            const token = await testKit.accVerifToken.generate({ id });
            const res = await testKit.restClient.get(`${verifyAccountUrl}?token=${token}`);
            expect(res.body).toStrictEqual({ error: AUTH_MESSAGES.ACCOUNT_IS_SUSPENDED });
            expect(res.status).toBe(HttpStatus.FORBIDDEN);
        });
    });

    describe('Target account is already verified', () => {
        test(`return BAD REQUEST status code and "${AUTH_MESSAGES.ACCOUNT_ALREADY_VERIFIED}" message`, async () => {
            const { id } = await createAccount({ status: AccountStatus.ACTIVE });
            const token = await testKit.accVerifToken.generate({ id });
            const res = await testKit.restClient.get(`${verifyAccountUrl}?token=${token}`);
            console.log({ body: res.body });
            expect(res.body).toStrictEqual({ error: AUTH_MESSAGES.ACCOUNT_ALREADY_VERIFIED });
            expect(res.status).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe(`More than ${THROTTLE_CONFIG.ULTRA_CRITICAL.limit} attemps in ${THROTTLE_CONFIG.ULTRA_CRITICAL.ttl / 1000}s from the same ip`, () => {
        test(`should return TOO MANY REQUESTS status code and "${COMMON_MESSAGES.TOO_MANY_REQUESTS}" message`, async () => {
            const invalidToken = faker.string.uuid();
            const sameIp = faker.internet.ip();
            const requests = Array.from({ length: THROTTLE_CONFIG.ULTRA_CRITICAL.limit }, () =>
                testKit.restClient
                    .get(`${verifyAccountUrl}?token=${invalidToken}`)
                    .set('X-Forwarded-For', sameIp),
            );
            await Promise.all(requests);
            const res = await testKit.restClient
                .get(verifyAccountUrl)
                .set('X-Forwarded-For', sameIp);
            expect(res.body).toStrictEqual({ error: COMMON_MESSAGES.TOO_MANY_REQUESTS });
            expect(res.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
        });
    });
});
