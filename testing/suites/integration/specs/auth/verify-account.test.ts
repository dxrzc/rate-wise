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

const verifyAccountUrl = testKit.endpointsREST.verifyAccount;

describe(`GET ${verifyAccountUrl}`, () => {
    let tokenService: TokensService<IAccVerifTokenPayload>;

    beforeAll(() => {
        tokenService = testKit.app.get<TokensService<IAccVerifTokenPayload>>(
            ACCOUNT_VERIFICATION_TOKEN,
        );
    });

    describe('Account successfully verified', () => {
        test('account status should be updated to ACTIVE', async () => {
            const { id } = await createAccount();
            const token = await tokenService.generate({ id });
            const res = await testKit.restClient.get(`${verifyAccountUrl}?token=${token}`);
            const userInDb = await testKit.userRepos.findOneBy({ id });
            expect(res.status).toBe(HttpStatus.OK);
            expect(userInDb?.status).toBe(AccountStatus.ACTIVE);
        });
    });

    describe('Account successfully verified', () => {
        test('token should be blacklisted', async () => {
            const { id } = await createAccount();
            const token = await tokenService.generate({ id });
            const res = await testKit.restClient.get(`${verifyAccountUrl}?token=${token}`);
            const { jti } = await tokenService['verifyTokenOrThrow']<JwtPayload<any>>(token);
            const redisKey = blacklistTokenKey(jti);
            const isBlacklisted = await testKit.tokensRedisClient.get(redisKey);
            expect(res.status).toBe(HttpStatus.OK);
            expect(isBlacklisted).toBe(1);
        });
    });

    describe('No token provided', () => {
        test(`return BAD REQUEST and "${AUTH_MESSAGES.INVALID_URL}" message`, async () => {
            const res = await testKit.restClient.get(verifyAccountUrl);
            expect(res.body.message).toBe(AUTH_MESSAGES.INVALID_URL);
            expect(res.status).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe('Invalid token', () => {
        test(`return BAD REQUEST and "${AUTH_MESSAGES.INVALID_TOKEN}" message`, async () => {
            const invalidToken = faker.string.uuid();
            const res = await testKit.restClient.get(`${verifyAccountUrl}?token=${invalidToken}`);
            expect(res.body.message).toBe(AUTH_MESSAGES.INVALID_TOKEN);
            expect(res.status).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe('Target account is suspended', () => {
        test(`return FORBIDDEN and "${AUTH_MESSAGES.ACCOUNT_SUSPENDED}" message`, async () => {
            const { id } = await createAccount(AccountStatus.SUSPENDED);
            const token = await tokenService.generate({ id });
            const res = await testKit.restClient.get(`${verifyAccountUrl}?token=${token}`);
            expect(res.body.message).toBe(AUTH_MESSAGES.ACCOUNT_SUSPENDED);
            expect(res.status).toBe(HttpStatus.FORBIDDEN);
        });
    });

    describe('Target account is already verified', () => {
        test(`return BAD REQUEST and "${AUTH_MESSAGES.ACCOUNT_ALREADY_VERIFIED}" message`, async () => {
            const { id } = await createAccount(AccountStatus.ACTIVE);
            const token = await tokenService.generate({ id });
            const res = await testKit.restClient.get(`${verifyAccountUrl}?token=${token}`);
            expect(res.body.message).toBe(AUTH_MESSAGES.ACCOUNT_ALREADY_VERIFIED);
            expect(res.status).toBe(HttpStatus.BAD_REQUEST);
        });
    });

    describe(`More than ${THROTTLE_CONFIG.ULTRA_CRITICAL.limit} attemps in ${THROTTLE_CONFIG.ULTRA_CRITICAL.ttl / 1000}s from the same ip`, () => {
        test(`should return TOO MANY REQUESTS code and "${COMMON_MESSAGES.TOO_MANY_REQUESTS}" message`, async () => {
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
            expect(res.body.message).toBe(COMMON_MESSAGES.TOO_MANY_REQUESTS);
            expect(res.status).toBe(HttpStatus.TOO_MANY_REQUESTS);
        });
    });
});
