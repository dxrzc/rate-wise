import { requestAccountVerification } from '@testing/tools/gql-operations/auth/request-account-verification.operation';
import { faker } from '@faker-js/faker/.';
import { createAccount } from '@integration/utils/create-account.util';
import { testKit } from '@integration/utils/test-kit.util';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { THROTTLE_CONFIG } from 'src/common/constants/throttle.config.constants';
import { Code } from 'src/common/enum/code.enum';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';
import { AccountStatus } from 'src/users/enums/account-status.enum';

describe('requestAccountVerification', () => {
    describe('Account status is "ACTIVE"', () => {
        test('return BAD REQUEST and ACCOUNT_ALREADY_VERIFIED message', async () => {
            const { sessionCookie } = await createAccount(AccountStatus.ACTIVE);
            const res = await testKit.gqlClient
                .set('Cookie', sessionCookie)
                .send(requestAccountVerification());
            expect(res).toFailWith(Code.BAD_REQUEST, AUTH_MESSAGES.ACCOUNT_ALREADY_VERIFIED);
        });
    });

    describe('Account is status "SUSPENDED"', () => {
        test('return FORBIDDEN and ACCOUNT_SUSPENDED message', async () => {
            const { sessionCookie } = await createAccount(AccountStatus.SUSPENDED);
            const res = await testKit.gqlClient
                .set('Cookie', sessionCookie)
                .send(requestAccountVerification());
            expect(res).toFailWith(Code.FORBIDDEN, AUTH_MESSAGES.ACCOUNT_IS_SUSPENDED);
        });
    });

    describe('Account is status "PENDING_VERIFICATION"', () => {
        test('email should be sent to user email address', async () => {
            const { sessionCookie, email } = await createAccount(
                AccountStatus.PENDING_VERIFICATION,
            );
            const res = await testKit.gqlClient
                .set('Cookie', sessionCookie)
                .send(requestAccountVerification());
            expect(res).notToFail();
            await expect(email).emailSentToThisAddress();
        });
    });

    describe(`More than ${THROTTLE_CONFIG.ULTRA_CRITICAL.limit} attemps in ${THROTTLE_CONFIG.ULTRA_CRITICAL.ttl / 1000}s from the same ip`, () => {
        test('should return TOO MANY REQUESTS code and message', async () => {
            const ip = faker.internet.ip();
            for (let i = 0; i < THROTTLE_CONFIG.ULTRA_CRITICAL.limit; i++)
                await testKit.gqlClient
                    .set('X-Forwarded-For', ip)
                    .send(requestAccountVerification());
            const res = await testKit.gqlClient
                .set('X-Forwarded-For', ip)
                .send(requestAccountVerification());
            expect(res).toFailWith(Code.TOO_MANY_REQUESTS, COMMON_MESSAGES.TOO_MANY_REQUESTS);
        });
    });
});
