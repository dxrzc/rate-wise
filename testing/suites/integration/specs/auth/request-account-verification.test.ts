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
import { UserRole } from 'src/users/enums/user-role.enum';

describe('GraphQL - requestAccountVerification', () => {
    describe('Session cookie not provided', () => {
        test('return unauthorized code and unauthorized error message', async () => {
            const res = await testKit.gqlClient.send(requestAccountVerification());
            expect(res).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.UNAUTHORIZED);
        });
    });

    describe('Account status is active', () => {
        test('return bad request code and account already verified error message', async () => {
            const { sessionCookie } = await createAccount({ status: AccountStatus.ACTIVE });
            const res = await testKit.gqlClient
                .set('Cookie', sessionCookie)
                .send(requestAccountVerification());
            expect(res).toFailWith(Code.BAD_REQUEST, AUTH_MESSAGES.ACCOUNT_ALREADY_VERIFIED);
        });
    });

    describe('Account status is suspended', () => {
        test('return forbidden code and account is suspended error message', async () => {
            const { sessionCookie } = await createAccount({ status: AccountStatus.SUSPENDED });
            const res = await testKit.gqlClient
                .set('Cookie', sessionCookie)
                .send(requestAccountVerification());
            expect(res).toFailWith(Code.FORBIDDEN, AUTH_MESSAGES.ACCOUNT_IS_SUSPENDED);
        });
    });

    describe('Account status is pending verification', () => {
        test('email is sent to user email address', async () => {
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

    describe('User in session cookie does not exist', () => {
        test('return unauthorized code and unauthorized error message', async () => {
            const { sessionCookie, id } = await createAccount();
            await testKit.userRepos.delete({ id });
            const res = await testKit.gqlClient
                .send(requestAccountVerification())
                .set('Cookie', sessionCookie);
            expect(res).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.UNAUTHORIZED);
        });
    });

    describe.each(Object.values(UserRole))('User roles are: [%s]', (role: UserRole) => {
        test('email is sent to the user email address', async () => {
            const { email, sessionCookie } = await createAccount({
                roles: [role],
            });
            await testKit.gqlClient.send(requestAccountVerification()).set('Cookie', sessionCookie);
            await expect(email).emailSentToThisAddress();
        });
    });

    describe('More than allowed attempts from same ip', () => {
        test('return too many requests code and too many requests error message', async () => {
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
