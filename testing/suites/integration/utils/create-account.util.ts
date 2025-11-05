import { signUp } from '@testing/tools/gql-operations/auth/sign-up.operation';
import { getSessionCookie } from './get-session-cookie.util';
import { UserModel } from 'src/users/models/user.model';
import { testKit } from './test-kit.util';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { UserRole } from 'src/users/enums/user-role.enum';

interface ExtraData {
    password: string;
    sessionCookie: string;
}

// By default, account default values
export async function createAccount(
    status: AccountStatus = AccountStatus.PENDING_VERIFICATION,
    role: UserRole = UserRole.USER,
): Promise<UserModel & ExtraData> {
    const user = testKit.userSeed.signUpInput;
    const res = await testKit.gqlClient.send(signUp({ fields: 'ALL', args: user }));
    await testKit.userRepos.update({ id: res.body.data.signUp.id }, { status, role });
    return {
        ...(res.body.data.signUp as UserModel),
        password: user.password,
        sessionCookie: getSessionCookie(res),
    };
}
