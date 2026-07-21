import { faker } from '@faker-js/faker';
import { createAccount } from '@integration/utils/create-account.util';
import { getEmailSent } from '@integration/utils/get-email-sent.util';
import { success } from '@integration/utils/no-errors.util';
import { testKit } from '@integration/utils/test-kit.util';
import { requestSignOutAll } from '@testing/tools/gql-operations/auth/request-sign-out-all.operation';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { RATE_LIMIT_PROFILES } from 'src/common/rate-limit/rate-limit.profiles';
import { Code } from 'src/common/enums/code.enum';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';
import { AccountStatus } from 'src/users/enums/account-status.enum';

describe('Gql - requestSignOutAll (public)', () => {
    describe('Invalid email format', () => {
        test('return bad request code and invalid input error message', async () => {
            const invalidEmail = 'invalidEmail';
            const res = await testKit.gqlClient.send(
                requestSignOutAll({ args: { email: invalidEmail } }),
            );
            expect(res).toFailWith(Code.BAD_REQUEST, COMMON_MESSAGES.INVALID_INPUT);
        });
    });

    describe('Target account is suspended', () => {
        test('return success message', async () => {
            const { email } = await createAccount({ status: AccountStatus.SUSPENDED });
            const res = await testKit.gqlClient
                .send(requestSignOutAll({ args: { email } }))
                .expect(success);
            expect(res.body.data.requestSignOutAll).toBe(AUTH_MESSAGES.EMAIL_SENT_IF_EXISTS);
        });

        test('should not send any email', async () => {
            const { email } = await createAccount({ status: AccountStatus.SUSPENDED });
            await testKit.gqlClient.send(requestSignOutAll({ args: { email } }));
            await expect(email).not.emailSentToThisAddress();
        });
    });

    describe('Target account is pending_verification', () => {
        test('return success message', async () => {
            const { email } = await createAccount({ status: AccountStatus.PENDING_VERIFICATION });
            const res = await testKit.gqlClient
                .send(requestSignOutAll({ args: { email } }))
                .expect(success);
            expect(res.body.data.requestSignOutAll).toBe(AUTH_MESSAGES.EMAIL_SENT_IF_EXISTS);
        });

        test('send email to the email address', async () => {
            const { email } = await createAccount({ status: AccountStatus.PENDING_VERIFICATION });
            await testKit.gqlClient.send(requestSignOutAll({ args: { email } }));
            await expect(email).emailSentToThisAddress();
        });
    });

    describe('Valid email and user exists', () => {
        test('email is sent to the user email address with correct subject and token', async () => {
            const { sessionCookie, email, id } = await createAccount();
            await testKit.gqlClient
                .send(requestSignOutAll({ args: { email } }))
                .set('Cookie', sessionCookie)
                .expect(success);
            const emailSent = await getEmailSent(email);
            expect(emailSent.meta.Subject).toBe('Sign out of all sessions');
            const token = emailSent.message.Text.match(/token=([a-zA-Z0-9._-]+)/)![1];
            const payload = await testKit.signOutAllToken.verify(token);
            expect(payload.id).toBe(id);
        });
    });

    describe('Email does not exist', () => {
        test('return success message', async () => {
            const validEmail = testKit.userSeed.email;
            const res = await testKit.gqlClient
                .send(requestSignOutAll({ args: { email: validEmail } }))
                .expect(success);
            expect(res.body.data.requestSignOutAll).toBe(AUTH_MESSAGES.EMAIL_SENT_IF_EXISTS);
        });

        test('should not send any email', async () => {
            const validEmail = testKit.userSeed.email;
            await testKit.gqlClient.send(requestSignOutAll({ args: { email: validEmail } }));
            await expect(validEmail).not.emailSentToThisAddress();
        });
    });

    describe('More than allowed attempts from the same ip', () => {
        test('return too many requests code and too many requests error message', async () => {
            const ip = faker.internet.ip();
            await Promise.all(
                Array.from({ length: RATE_LIMIT_PROFILES.ULTRA_CRITICAL.limit }, () =>
                    testKit.gqlClient
                        .set('X-Forwarded-For', ip)
                        .send(requestSignOutAll({ args: { email: testKit.userSeed.email } })),
                ),
            );
            const res = await testKit.gqlClient
                .set('X-Forwarded-For', ip)
                .send(requestSignOutAll({ args: { email: testKit.userSeed.email } }));
            expect(res).toFailWith(Code.TOO_MANY_REQUESTS, COMMON_MESSAGES.TOO_MANY_REQUESTS);
        });
    });
});
