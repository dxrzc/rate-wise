import { EmailPaths } from '@e2e/enum/email-paths.enum';
import { e2eKit } from '@e2e/utils/e2e-kit.util';
import { requestSignOutAll } from '@testing/tools/gql-operations/auth/request-sign-out-all.operation';
import { signIn } from '@testing/tools/gql-operations/auth/sign-in.operation';
import { signUp } from '@testing/tools/gql-operations/auth/sign-up.operation';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { Code } from 'src/common/enum/code.enum';

describe('Account signing out all (public) flow', () => {
    test('restores sign-in after exceeding session limit', async () => {
        const user = e2eKit.usersSeed.signUpInput;
        const maxSessions = e2eKit.appConfig.maxUserSessions;
        // create user
        const userCreation = await e2eKit.httpClient.graphQL(
            signUp({ args: user, fields: ['id'] }),
        );
        expect(userCreation).notToFail();
        // reach max sessions
        for (let i = 1; i < maxSessions; i++) {
            const client = e2eKit.httpClient.getNewClient();
            const signInRes = await client.graphQL(
                signIn({ args: { email: user.email, password: user.password }, fields: ['id'] }),
            );
            expect(signInRes).notToFail();
        }
        // user can no longer sign in
        const exceedClient = e2eKit.httpClient.getNewClient();
        const exceedAttempt = await exceedClient.graphQL(
            signIn({ args: { email: user.email, password: user.password }, fields: ['id'] }),
        );
        expect(exceedAttempt).toFailWith(Code.FORBIDDEN, AUTH_MESSAGES.MAX_SESSIONS_REACHED);
        // request sign out all
        const signOutAllReq = await e2eKit.httpClient.graphQL(
            requestSignOutAll({ args: { email: user.email } }),
        );
        expect(signOutAllReq).notToFail();
        // confirm sign out all via email link
        const link = await e2eKit.emailClient.getLinkSent(EmailPaths.signOutAll, user.email);
        expect(link).not.toBeNull();
        await e2eKit.httpClient.get(link!);
        // user can sign in again
        const signInAfter = await e2eKit.httpClient
            .getNewClient()
            .graphQL(
                signIn({ args: { email: user.email, password: user.password }, fields: ['id'] }),
            );
        expect(signInAfter).notToFail();
    });
});
