import { EmailPaths } from '@e2e/enum/email-paths.enum';
import { e2eKit } from '@e2e/utils/e2e-kit.util';
import { requestAccountDeletion } from '@testing/tools/gql-operations/auth/request-account-deletion.operation';
import { signIn } from '@testing/tools/gql-operations/auth/sign-in.operation';
import { signUp } from '@testing/tools/gql-operations/auth/sign-up.operation';
import { findUserById } from '@testing/tools/gql-operations/users/find-by-id.operation';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { Code } from 'src/common/enum/code.enum';
import { USER_MESSAGES } from 'src/users/messages/user.messages';

describe('Account deletion flow', () => {
    test('user can not sign-in after deletion', async () => {
        // create user
        const user = e2eKit.usersSeed.signUpInput;
        const userCreation = await e2eKit.httpClient.graphQL(
            signUp({ args: user, fields: ['id'] }),
        );
        expect(userCreation).notToFail();
        // user can sign-in succesfully
        const signInRes = await e2eKit.httpClient.graphQL(
            signIn({ args: { email: user.email, password: user.password }, fields: ['id'] }),
        );
        expect(signInRes).notToFail();
        // request account deletion
        const reqAccountDeletion = await e2eKit.httpClient.graphQL(requestAccountDeletion());
        expect(reqAccountDeletion).notToFail();
        // confirm account deletion via link
        const link = await e2eKit.emailClient.getLinkSent(EmailPaths.deleteAccount, user.email);
        await e2eKit.httpClient.get(link!);
        // user can not sign-in anymore
        const signInAttempt = await e2eKit.httpClient.graphQL(
            signIn({
                args: { email: user.email, password: user.password },
                fields: ['id'],
            }),
        );
        expect(signInAttempt).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.INVALID_CREDENTIALS);
    });

    test('user can not be found after deletion', async () => {
        // create user
        const user = e2eKit.usersSeed.signUpInput;
        const userCreation = await e2eKit.httpClient.graphQL(
            signUp({ args: user, fields: ['id'] }),
        );
        expect(userCreation).notToFail();
        const userId = userCreation.body.data.signUp.id;
        // user can be found successfully
        const findUserRes = await e2eKit.httpClient.graphQL(
            findUserById({ args: userId, fields: ['id', 'email'] }),
        );
        expect(findUserRes).notToFail();
        // request account deletion
        const signInRes = await e2eKit.httpClient.graphQL(
            signIn({ args: { email: user.email, password: user.password }, fields: ['id'] }),
        );
        expect(signInRes).notToFail();
        const reqAccountDeletion = await e2eKit.httpClient.graphQL(requestAccountDeletion());
        expect(reqAccountDeletion).notToFail();
        // confirm account deletion via link
        const link = await e2eKit.emailClient.getLinkSent(EmailPaths.deleteAccount, user.email);
        await e2eKit.httpClient.get(link!);
        // user can not be found anymore
        const findUserAttempt = await e2eKit.httpClient.graphQL(
            findUserById({ args: userId, fields: ['id', 'email'] }),
        );
        expect(findUserAttempt).toFailWith(Code.NOT_FOUND, USER_MESSAGES.NOT_FOUND);
    });
});
