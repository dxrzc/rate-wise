import { createAndVerifyAccount } from '@e2e/utils/create-and-verify-account.util';
import { e2eKit } from '@e2e/utils/e2e-kit.util';
import { signIn } from '@testing/tools/gql-operations/auth/sign-in.operation';
import { signOutAll } from '@testing/tools/gql-operations/auth/sign-out-all.operation';
import { createItem } from '@testing/tools/gql-operations/items/create-item.operation';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { Code } from 'src/common/enum/code.enum';

describe('Sign out all flow', () => {
    test('user can not access protected resources after signing out all', async () => {
        // create user
        const { userData, client: client1 } = await createAndVerifyAccount();
        // signing with new client
        const client2 = e2eKit.httpClient.getNewClient();
        const signInRes = await client2.graphQL(
            signIn({
                args: { email: userData.email, password: userData.password },
                fields: ['id'],
            }),
        );
        expect(signInRes).notToFail();
        // sign out all
        const signOutAllRes = await client2.graphQL(
            signOutAll({
                args: { password: userData.password },
            }),
        );
        expect(signOutAllRes).notToFail();
        // user can not access protected resources with client 1
        const itemCreationAttempt1 = await client1.graphQL(
            createItem({ args: e2eKit.itemsSeed.itemInput, fields: ['id'] }),
        );
        expect(itemCreationAttempt1).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.UNAUTHORIZED);
        // user can not access protected resources with client 2
        const itemCreationAttempt2 = await client1.graphQL(
            createItem({ args: e2eKit.itemsSeed.itemInput, fields: ['id'] }),
        );
        expect(itemCreationAttempt2).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.UNAUTHORIZED);
    });
});
