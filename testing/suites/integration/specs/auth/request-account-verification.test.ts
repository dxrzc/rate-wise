import { requestAccountVerification } from '@testing/tools/gql-operations/auth/request-account-verification.operation';
import { faker } from '@faker-js/faker/.';
import { createAccount } from '@integration/utils/create-account.util';
import { testKit } from '@integration/utils/test-kit.util';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { THROTTLE_CONFIG } from 'src/common/constants/throttle.config.constants';
import { Code } from 'src/common/enum/code.enum';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { success } from '@integration/utils/no-errors.util';

describe('GraphQL - requestAccountVerification', () => {
    describe('Session cookie not provided', () => {
        test(`return ${Code.UNAUTHORIZED} and ${AUTH_MESSAGES.UNAUTHORIZED} message`, async () => {
            const res = await testKit.gqlClient.send(requestAccountVerification());
            expect(res).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.UNAUTHORIZED);
        });
    });

    describe(`Account status is "${AccountStatus.ACTIVE}"`, () => {
        test(`return ${Code.BAD_REQUEST} and ${AUTH_MESSAGES.ACCOUNT_ALREADY_VERIFIED} message`, async () => {
            const { sessionCookie } = await createAccount({ status: AccountStatus.ACTIVE });
            const res = await testKit.gqlClient
                .set('Cookie', sessionCookie)
                .send(requestAccountVerification());
            expect(res).toFailWith(Code.BAD_REQUEST, AUTH_MESSAGES.ACCOUNT_ALREADY_VERIFIED);
        });
    });

    describe(`Account is status "${AccountStatus.SUSPENDED}"`, () => {
        test(`return ${Code.FORBIDDEN} and ${AUTH_MESSAGES.ACCOUNT_IS_SUSPENDED} message`, async () => {
            const { sessionCookie } = await createAccount({ status: AccountStatus.SUSPENDED });
            const res = await testKit.gqlClient
                .set('Cookie', sessionCookie)
                .send(requestAccountVerification());
            expect(res).toFailWith(Code.FORBIDDEN, AUTH_MESSAGES.ACCOUNT_IS_SUSPENDED);
        });
    });

    describe(`Account is status "${AccountStatus.PENDING_VERIFICATION}"`, () => {
        test('email should be sent to user email address', async () => {
            const { sessionCookie, email } = await createAccount({
                status: AccountStatus.PENDING_VERIFICATION,
            });
            await testKit.gqlClient
                .set('Cookie', sessionCookie)
                .send(requestAccountVerification())
                .expect(success);
            await expect(email).emailSentToThisAddress();
        });
    });

    describe(`More than ${THROTTLE_CONFIG.ULTRA_CRITICAL.limit} attemps in ${THROTTLE_CONFIG.ULTRA_CRITICAL.ttl / 1000}s from the same ip`, () => {
        test(`should return "${Code.TOO_MANY_REQUESTS}" code and "${COMMON_MESSAGES.TOO_MANY_REQUESTS}" message`, async () => {
            const ip = faker.internet.ip();
            await Promise.all(
                Array.from({ length: THROTTLE_CONFIG.ULTRA_CRITICAL.limit }, () =>
                    testKit.gqlClient.set('X-Forwarded-For', ip).send(requestAccountVerification()),
                ),
            );
            const res = await testKit.gqlClient
                .set('X-Forwarded-For', ip)
                .send(requestAccountVerification());
            expect(res).toFailWith(Code.TOO_MANY_REQUESTS, COMMON_MESSAGES.TOO_MANY_REQUESTS);
        });
    });
});
