import { e2eKit } from '@e2e/utils/e2e-kit.util';
import { signIn } from '@testing/tools/gql-operations/auth/sign-in.operation';
import { signUp } from '@testing/tools/gql-operations/auth/sign-up.operation';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { Code } from 'src/common/enums/code.enum';

describe('Account creation flow', () => {
    test('user can sign-in after creation', async () => {
        const user = e2eKit.usersSeed.signUpInput;
        // non-created user can not sign-in
        const signInAttempt = await e2eKit.httpClient.graphQL(
            signIn({ args: { email: user.email, password: user.password }, fields: ['id'] }),
        );
        expect(signInAttempt).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.INVALID_CREDENTIALS);
        // create user
        const userCreation = await e2eKit.httpClient.graphQL(
            signUp({ args: user, fields: ['id'] }),
        );
        expect(userCreation).notToFail();
        // user can sign-in succesfully
        const signInRes = await e2eKit.httpClient.graphQL(
            signIn({ args: { email: user.email, password: user.password }, fields: ['id'] }),
        );
        expect(signInRes).notToFail();
    });
});
