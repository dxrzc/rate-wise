import { faker } from '@faker-js/faker/.';
import { createAccount } from '@integration/utils/create-account.util';
import { testKit } from '@integration/utils/test-kit.util';
import { HttpStatus } from '@nestjs/common';
import { ACCOUNT_VERIFICATION_TOKEN } from 'src/auth/constants/tokens.provider.constant';
import { IAccVerifTokenPayload } from 'src/auth/interfaces/tokens-payload.interface';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { THROTTLE_CONFIG } from 'src/common/constants/throttle.config.constants';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';
import { blacklistTokenKey } from 'src/tokens/functions/blacklist-token-key';
import { TokensService } from 'src/tokens/tokens.service';
import { JwtPayload } from 'src/tokens/types/jwt-payload.type';
import { AccountStatus } from 'src/users/enums/account-status.enum';

// REST API
describe('verifyAccount', () => {
    describe('No token provided', () => {
        test('return BAD REQUEST and INVALID URL message', async () => {
            const res = await testKit.restClient.get(
                testKit.endpointsREST.verifyAccount,
            );
            expect(res.body.message).toBe(AUTH_MESSAGES.INVALID_URL);
            expect(res.status).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe('Invalid token', () => {
        test('return BAD REQUEST and INVALID_TOKEN message', async () => {
            const invalidToken = faker.string.uuid();
            const res = await testKit.restClient.get(
                `${testKit.endpointsREST.verifyAccount}?token=${invalidToken}`,
            );
            expect(res.body.message).toBe(AUTH_MESSAGES.INVALID_TOKEN);
            expect(res.status).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe('Target account is suspended', () => {
        test('return FORBIDDEN and ACCOUNT_SUSPENDED message', async () => {
            const { id } = await createAccount(AccountStatus.SUSPENDED);
            const tokenService = testKit.app.get<
                TokensService<IAccVerifTokenPayload>
            >(ACCOUNT_VERIFICATION_TOKEN);
            const token = await tokenService.generate({ id });
            const res = await testKit.restClient.get(
                `${testKit.endpointsREST.verifyAccount}?token=${token}`,
            );
            expect(res.body.message).toBe(AUTH_MESSAGES.ACCOUNT_SUSPENDED);
            expect(res.status).toBe(HttpStatus.FORBIDDEN);
        });
    });

    describe('Target account is already verified', () => {
        test('return BAD REQUEST and ACCOUNT_ALREADY_VERIFIED message', async () => {
            const { id } = await createAccount(AccountStatus.ACTIVE);
            const tokenService = testKit.app.get<
                TokensService<IAccVerifTokenPayload>
            >(ACCOUNT_VERIFICATION_TOKEN);
            const token = await tokenService.generate({ id });
            const res = await testKit.restClient.get(
                `${testKit.endpointsREST.verifyAccount}?token=${token}`,
            );
            expect(res.body.message).toBe(
                AUTH_MESSAGES.ACCOUNT_ALREADY_VERIFIED,
            );
            expect(res.status).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe('Account successfully verified', () => {
        test('account status should be updated to ACTIVE', async () => {
            const { id } = await createAccount();
            const tokenService = testKit.app.get<
                TokensService<IAccVerifTokenPayload>
            >(ACCOUNT_VERIFICATION_TOKEN);
            const token = await tokenService.generate({ id });
            // verify
            const res = await testKit.restClient.get(
                `${testKit.endpointsREST.verifyAccount}?token=${token}`,
            );
            const userInDb = await testKit.userRepos.findOneBy({ id });
            expect(res.status).toBe(HttpStatus.OK);
            expect(userInDb?.status).toBe(AccountStatus.ACTIVE);
        });

        test('token should be blacklisted', async () => {
            const { id } = await createAccount();
            const tokenSvc = testKit.app.get<
                TokensService<IAccVerifTokenPayload>
            >(ACCOUNT_VERIFICATION_TOKEN);
            const token = await tokenSvc.generate({ id });
            // verify
            const res = await testKit.restClient.get(
                `${testKit.endpointsREST.verifyAccount}?token=${token}`,
            );
            const { jti } =
                await tokenSvc['verifyTokenOrThrow']<JwtPayload<any>>(token);
            const redisKey = blacklistTokenKey(jti);
            const isBlacklisted = await testKit.tokensRedisClient.get(redisKey);
            expect(res.status).toBe(HttpStatus.OK);
            expect(isBlacklisted).toBe(1);
        });
    });

    describe(`More than ${THROTTLE_CONFIG.ULTRA_CRITICAL.limit} attemps in ${THROTTLE_CONFIG.ULTRA_CRITICAL.ttl / 1000}s from the same ip`, () => {
        test('should return TOO MANY REQUESTS code and message', async () => {
            const invalidToken = faker.string.uuid();
            const sameIp = faker.internet.ip();
            for (let i = 0; i < THROTTLE_CONFIG.ULTRA_CRITICAL.limit; i++) {
                await testKit.restClient
                    .get(
                        `${testKit.endpointsREST.verifyAccount}?token=${invalidToken}`,
                    )
                    .set('X-Forwarded-For', sameIp);
            }
            const res = await testKit.restClient
                .get(testKit.endpointsREST.verifyAccount)
                .set('X-Forwarded-For', sameIp);
            expect(res.body.message).toBe(COMMON_MESSAGES.TOO_MANY_REQUESTS);
            expect(res.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
        });
    });
});
