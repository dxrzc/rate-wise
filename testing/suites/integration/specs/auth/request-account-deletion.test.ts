import { faker } from '@faker-js/faker/.';
import { createAccount } from '@integration/utils/create-account.util';
import { testKit } from '@integration/utils/test-kit.util';
import { requestAccountDeletion } from '@testing/tools/gql-operations/auth/request-account-deletion.operation';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { THROTTLE_CONFIG } from 'src/common/constants/throttle.config.constants';
import { Code } from 'src/common/enum/code.enum';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { UserRole } from 'src/users/enums/user-role.enum';

describe('GraphQL - requestAccountDeletion', () => {
    describe('Session cookie not provided', () => {
        test(`return ${Code.UNAUTHORIZED} and ${AUTH_MESSAGES.UNAUTHORIZED} message`, async () => {
            const res = await testKit.gqlClient.send(requestAccountDeletion());
            expect(res).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.UNAUTHORIZED);
        });
    });

    describe(`Account status is "${AccountStatus.SUSPENDED}"`, () => {
        test('email should be sent to the user email address', async () => {
            const { email, sessionCookie } = await createAccount({
                status: AccountStatus.SUSPENDED,
            });
            await testKit.gqlClient.send(requestAccountDeletion()).set('Cookie', sessionCookie);
            await expect(email).emailSentToThisAddress();
        });
    });

    describe.each(Object.values(UserRole))('User roles are: [%s]', (role: UserRole) => {
        test('email should be sent to the user email address', async () => {
            const { email, sessionCookie } = await createAccount({
                roles: [role],
            });
            await testKit.gqlClient.send(requestAccountDeletion()).set('Cookie', sessionCookie);
            await expect(email).emailSentToThisAddress();
        });
    });

    describe('User in session cookie does not exist', () => {
        test(`should return code "${Code.UNAUTHORIZED}" and "${AUTH_MESSAGES.UNAUTHORIZED}" message`, async () => {
            const { sessionCookie, id } = await createAccount();
            await testKit.userRepos.delete({ id });
            const res = await testKit.gqlClient
                .send(requestAccountDeletion())
                .set('Cookie', sessionCookie);
            expect(res).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.UNAUTHORIZED);
        });
    });

    describe(`More than ${THROTTLE_CONFIG.ULTRA_CRITICAL.limit} attemps in ${THROTTLE_CONFIG.ULTRA_CRITICAL.ttl / 1000}s from the same ip`, () => {
        test(`should return "${Code.TOO_MANY_REQUESTS}" code and "${COMMON_MESSAGES.TOO_MANY_REQUESTS}" message`, async () => {
            const ip = faker.internet.ip();
            await Promise.all(
                Array.from({ length: THROTTLE_CONFIG.ULTRA_CRITICAL.limit }, () =>
                    testKit.gqlClient.set('X-Forwarded-For', ip).send(requestAccountDeletion()),
                ),
            );
            const res = await testKit.gqlClient
                .set('X-Forwarded-For', ip)
                .send(requestAccountDeletion());
            expect(res).toFailWith(Code.TOO_MANY_REQUESTS, COMMON_MESSAGES.TOO_MANY_REQUESTS);
        });
    });
});
