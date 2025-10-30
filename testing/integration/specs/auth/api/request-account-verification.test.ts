import { requestAccountVerification } from '@commontestutils/operations/auth/request-account-verification.operation';
import {
    createActiveUser,
    createUser,
} from '@integration/utils/create-user.util';
import { testKit } from '@integration/utils/test-kit.util';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { Code } from 'src/common/enum/code.enum';

describe('requestAccountVerification', () => {
    describe('Target account is already verified', () => {
        test('return BAD REQUEST and ACCOUNT_ALREADY_VERIFIED message', async () => {
            const { sessionCookie } = await createActiveUser();
            const res = await testKit.request
                .set('Cookie', sessionCookie)
                .send(requestAccountVerification());
            expect(res).toFailWith(
                Code.BAD_REQUEST,
                AUTH_MESSAGES.ACCOUNT_ALREADY_VERIFIED,
            );
        });
    });

    describe('Request approved successfully', () => {
        test('email should be sent to user email address', async () => {
            const { sessionCookie, email } = await createUser();
            const res = await testKit.request
                .set('Cookie', sessionCookie)
                .send(requestAccountVerification());
            expect(res).notToFail();
            await expect(email).emailSentToThisAddress();
        });
    });
});
