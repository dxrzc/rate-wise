import { signUp } from '@commontestutils/operations/auth/sign-up.operation';
import { getSessionCookie } from './get-session-cookie.util';
import { UserModel } from 'src/users/models/user.model';
import { testKit } from './test-kit.util';
import { AccountStatus } from 'src/users/enums/account-status.enum';

interface ExtraData {
    password: string;
    sessionCookie: string;
}

// Default values
export async function createUser(): Promise<UserModel & ExtraData> {
    const user = testKit.userSeed.signUpInput;
    const res = await testKit.gqlClient.send(
        signUp({
            fields: 'ALL',
            input: user,
        }),
    );
    return {
        ...(res.body.data.signUp as UserModel),
        password: user.password,
        sessionCookie: getSessionCookie(res),
    };
}

export async function createSuspendedUser(): Promise<UserModel & ExtraData> {
    const user = testKit.userSeed.signUpInput;
    const res = await testKit.gqlClient.send(
        signUp({
            fields: 'ALL',
            input: user,
        }),
    );
    // Suspend the user
    await testKit.userRepos.update(
        { id: res.body.data.signUp.id },
        { status: AccountStatus.SUSPENDED },
    );
    return {
        ...(res.body.data.signUp as UserModel),
        password: user.password,
        sessionCookie: getSessionCookie(res),
    };
}

export async function createActiveUser(): Promise<UserModel & ExtraData> {
    const user = testKit.userSeed.signUpInput;
    const res = await testKit.gqlClient.send(
        signUp({
            fields: 'ALL',
            input: user,
        }),
    );
    // Activate the user
    await testKit.userRepos.update(
        { id: res.body.data.signUp.id },
        { status: AccountStatus.ACTIVE },
    );
    return {
        ...(res.body.data.signUp as UserModel),
        password: user.password,
        sessionCookie: getSessionCookie(res),
    };
}
