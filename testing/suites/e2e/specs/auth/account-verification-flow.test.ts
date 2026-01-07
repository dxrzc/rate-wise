import { EmailPaths } from '@e2e/enum/email-paths.enum';
import { e2eKit } from '@e2e/utils/e2e-kit.util';
import { requestAccountVerification } from '@testing/tools/gql-operations/auth/request-account-verification.operation';
import { signUp } from '@testing/tools/gql-operations/auth/sign-up.operation';
import { createItem } from '@testing/tools/gql-operations/items/create-item.operation';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { Code } from 'src/common/enum/code.enum';

describe('Account verification flow', () => {
    test('prevents item creations until email is verified, then allows them', async () => {
        // create user
        const user = e2eKit.usersSeed.signUpInput;
        const userCreation = await e2eKit.httpClient.graphQL(
            signUp({ args: user, fields: ['id'] }),
        );
        expect(userCreation).notToFail();
        // user cannot create items
        const itemCreation = await e2eKit.httpClient.graphQL(
            createItem({
                args: e2eKit.itemsSeed.itemInput,
                fields: ['id'],
            }),
        );
        expect(itemCreation).toFailWith(Code.FORBIDDEN, AUTH_MESSAGES.ACCOUNT_IS_NOT_ACTIVE);
        // request account verification
        const reqAccVerif = await e2eKit.httpClient.graphQL(requestAccountVerification());
        expect(reqAccVerif).notToFail();
        // verify email using link
        const link = await e2eKit.emailClient.getLinkSent(EmailPaths.verifyAccount, user.email);
        await e2eKit.httpClient.get(link!);
        // user can create items now
        const itemCreationAttempt2 = await e2eKit.httpClient.graphQL(
            createItem({
                args: e2eKit.itemsSeed.itemInput,
                fields: ['id'],
            }),
        );
        expect(itemCreationAttempt2).notToFail();
    });
});
