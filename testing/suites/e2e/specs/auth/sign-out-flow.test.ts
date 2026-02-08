import { createAndVerifyAccount } from '@e2e/utils/create-and-verify-account.util';
import { e2eKit } from '@e2e/utils/e2e-kit.util';
import { signIn } from '@testing/tools/gql-operations/auth/sign-in.operation';
import { signOut } from '@testing/tools/gql-operations/auth/sign-out.operation';
import { createItem } from '@testing/tools/gql-operations/items/create-item.operation';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { Code } from 'src/common/enums/code.enum';

describe('Sign out flow', () => {
    test('user can not access protected resources after signing out', async () => {
        // create user
        const { userData } = await createAndVerifyAccount();
        // sign in
        const anotherClient = e2eKit.httpClient.getNewClient();
        const signInRes = await anotherClient.graphQL(
            signIn({
                args: { email: userData.email, password: userData.password },
                fields: ['id'],
            }),
        );
        expect(signInRes).notToFail();
        // user can access protected resources
        const itemCreation = await anotherClient.graphQL(
            createItem({ args: e2eKit.itemsSeed.itemInput, fields: ['id'] }),
        );
        expect(itemCreation).notToFail();
        // sign out
        const signOutRes = await anotherClient.graphQL(signOut());
        expect(signOutRes).notToFail();
        // user can longer access protected resources
        const itemCreationAttempt = await anotherClient.graphQL(
            createItem({ args: e2eKit.itemsSeed.itemInput, fields: ['id'] }),
        );
        expect(itemCreationAttempt).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.UNAUTHORIZED);
    });
});
