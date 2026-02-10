import { faker } from '@faker-js/faker/.';
import { createAccount } from '@integration/utils/create-account.util';
import { getEmailSent } from '@integration/utils/get-email-sent.util';
import { success } from '@integration/utils/no-errors.util';
import { testKit } from '@integration/utils/test-kit.util';
import { requestAccountDeletion } from '@testing/tools/gql-operations/auth/request-account-deletion.operation';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { RATE_LIMIT_PROFILES } from 'src/common/rate-limit/rate-limit.profiles';
import { Code } from 'src/common/enums/code.enum';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { UserRole } from 'src/users/enums/user-role.enum';

describe('GraphQL - requestAccountDeletion', () => {
    describe('Session cookie not provided', () => {
        test('return unauthorized code and unauthorized error message', async () => {
            const res = await testKit.gqlClient.send(requestAccountDeletion());
            expect(res).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.UNAUTHORIZED);
        });
    });

    describe.each(Object.values(AccountStatus))(
        'Account status is: [%s]',
        (status: AccountStatus) => {
            test('user can perform this action', async () => {
                const { sessionCookie } = await createAccount({
                    status,
                });
                await testKit.gqlClient
                    .send(requestAccountDeletion())
                    .set('Cookie', sessionCookie)
                    .expect(success);
            });
        },
    );

    describe.each(Object.values(UserRole))('User roles are: [%s]', (role: UserRole) => {
        test('user can perform this action', async () => {
            const { sessionCookie } = await createAccount({
                roles: [role],
            });
            await testKit.gqlClient
                .send(requestAccountDeletion())
                .set('Cookie', sessionCookie)
                .expect(success);
        });
    });

    describe('User in session cookie does not exist', () => {
        test('return unauthorized code and unauthorized error message', async () => {
            const { sessionCookie, id } = await createAccount();
            await testKit.userRepos.delete({ id });
            const res = await testKit.gqlClient
                .send(requestAccountDeletion())
                .set('Cookie', sessionCookie);
            expect(res).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.UNAUTHORIZED);
        });
    });

    describe('Successful request account deletion', () => {
        test('email is sent to the user email address with correct subject and token', async () => {
            const { sessionCookie, email, id } = await createAccount();
            await testKit.gqlClient
                .send(requestAccountDeletion())
                .set('Cookie', sessionCookie)
                .expect(success);
            const emailsent = await getEmailSent(email);
            expect(emailsent.meta.Subject).toBe('Delete your Ratewise account');
            const token = emailsent.message.Text.match(/token=([a-zA-Z0-9._-]+)/)![1];
            const payload = await testKit.accDeletionToken.verify(token);
            expect(payload.id).toBe(id);
        });
    });

    describe('More than allowed attempts from same ip', () => {
        test('return too many requests code and too many requests error message', async () => {
            const ip = faker.internet.ip();
            await Promise.all(
                Array.from({ length: RATE_LIMIT_PROFILES.ULTRA_CRITICAL.limit }, () =>
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
