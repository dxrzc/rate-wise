import { signUp } from '@testing/tools/gql-operations/auth/sign-up.operation';
import { e2eKit } from './e2e-kit.util';
import { requestAccountVerification } from '@testing/tools/gql-operations/auth/request-account-verification.operation';
import { EmailPaths } from '@e2e/enums/email-paths.enum';
import { HttpClient } from '@e2e/client/http.client';
import { SignUpInput } from 'src/auth/graphql/inputs/sign-up.input';

type AccountCreated = {
    client: HttpClient;
    userData: SignUpInput;
};

export async function createAndVerifyAccount(): Promise<AccountCreated> {
    const client = e2eKit.httpClient.getNewClient();
    const user = e2eKit.usersSeed.signUpInput;
    const userCreation = await client.graphQL(signUp({ args: user, fields: ['id'] }));
    expect(userCreation).notToFail();
    const reqAccVerif = await client.graphQL(requestAccountVerification());
    expect(reqAccVerif).notToFail();
    const link = await e2eKit.emailClient.getLinkSent(EmailPaths.verifyAccount, user.email);
    await client.get(link!);
    return { client, userData: user };
}
