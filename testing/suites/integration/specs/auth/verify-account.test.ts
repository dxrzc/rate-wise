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

describe('GET verify account endpoint with token', () => {
    describe('Account successfully verified', () => {
        test('account status is updated to ACTIVE', async () => {
            const { id } = await createAccount();
            const token = await testKit.accVerifToken.generate({ id });
            const res = await testKit.restClient.get(`${verifyAccountUrl}?token=${token}`);
            const userInDb = await testKit.userRepos.findOneBy({ id });
            expect(res.status).toBe(HttpStatus.OK);
            expect(userInDb?.status).toBe(AccountStatus.ACTIVE);
        });

        test('token is blacklisted', async () => {
            const { id } = await createAccount();
            const { token, jti } = await testKit.accVerifToken.generate({ id }, { metadata: true });
            const res = await testKit.restClient.get(`${verifyAccountUrl}?token=${token}`);
            const redisKey = blacklistTokenKey(jti);
            const isBlacklisted = await testKit.tokensRedisClient.get(redisKey);
            expect(res.status).toBe(HttpStatus.OK);
            expect(isBlacklisted).toBe(1);
        });

        test('User is deleted from redis cache', async () => {
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
        test('return not found code and not found error message', async () => {
            const { id } = await createAccount();
            const token = await testKit.accVerifToken.generate({ id });
            await testKit.userRepos.delete(id); // user deleted
            const res = await testKit.restClient.get(`${verifyAccountUrl}?token=${token}`);
            expect(res.body).toStrictEqual({ error: USER_MESSAGES.NOT_FOUND });
            expect(res.statusCode).toBe(HttpStatus.NOT_FOUND);
        });
    });

    describe('No token provided', () => {
        test('return bad request status code and invalid url error message', async () => {
            const res = await testKit.restClient.get(verifyAccountUrl);
            expect(res.body).toStrictEqual({ error: AUTH_MESSAGES.INVALID_URL });
            expect(res.status).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe('Invalid token', () => {
        test('return unauthorized status code and invalid token error message', async () => {
            const invalidToken = faker.string.uuid();
            const res = await testKit.restClient.get(`${verifyAccountUrl}?token=${invalidToken}`);
            expect(res.body).toStrictEqual({ error: AUTH_MESSAGES.INVALID_TOKEN });
            expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
        });
    });

    describe('Token for account deletetion sent', () => {
        test('return unauthorized status code and invalid token error message', async () => {
            const { id } = await createAccount();
            // account-deletion token
            const accDeletionToken = await testKit.accDeletionToken.generate({ id });
            const res = await testKit.restClient.get(
                `${verifyAccountUrl}?token=${accDeletionToken}`,
            );
            expect(res.body).toStrictEqual({ error: AUTH_MESSAGES.INVALID_TOKEN });
            expect(res.status).toBe(HttpStatus.UNAUTHORIZED);
        });
    });

    describe('Target account is suspended', () => {
        test('return forbidden status code and account is suspended error message', async () => {
            const { id } = await createAccount({ status: AccountStatus.SUSPENDED });
            const token = await testKit.accVerifToken.generate({ id });
            const res = await testKit.restClient.get(`${verifyAccountUrl}?token=${token}`);
            expect(res.body).toStrictEqual({ error: AUTH_MESSAGES.ACCOUNT_IS_SUSPENDED });
            expect(res.status).toBe(HttpStatus.FORBIDDEN);
        });
    });

    describe('Target account is already verified', () => {
        test('return conflict status code and account already verified error message', async () => {
            const { id } = await createAccount({ status: AccountStatus.ACTIVE });
            const token = await testKit.accVerifToken.generate({ id });
            const res = await testKit.restClient.get(`${verifyAccountUrl}?token=${token}`);
            expect(res.body).toStrictEqual({ error: AUTH_MESSAGES.ACCOUNT_ALREADY_VERIFIED });
            expect(res.status).toBe(HttpStatus.CONFLICT);
        });
    });

    describe('More than allowed attempts from same ip', () => {
        test('return too many requests status code and too many requests error message', async () => {
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
