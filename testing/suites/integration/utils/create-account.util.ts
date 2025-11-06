import { signUp } from '@testing/tools/gql-operations/auth/sign-up.operation';
import { getSessionCookie } from './get-session-cookie.util';
import { UserModel } from 'src/users/models/user.model';
import { testKit } from './test-kit.util';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { UserRole } from 'src/users/enums/user-role.enum';
import { success } from './no-errors.util';

interface ExtraData {
    password: string;
    sessionCookie: string;
}

interface CreateAccountOptions {
    status?: AccountStatus;
    roles?: UserRole[];
}

// By default, account default values
export async function createAccount(
    options: CreateAccountOptions = {},
): Promise<UserModel & ExtraData> {
    const { status = AccountStatus.PENDING_VERIFICATION, roles = [UserRole.USER] } = options;
    const user = testKit.userSeed.signUpInput;
    const res = await testKit.gqlClient.send(signUp({ fields: 'ALL', args: user })).expect(success);
    await testKit.userRepos.update({ id: res.body.data.signUp.id }, { status, roles });
    return {
        ...(res.body.data.signUp as UserModel),
        password: user.password,
        sessionCookie: getSessionCookie(res),
    };
}
