/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { signUp } from '@utils/operations/auth/sign-up.operation';
import { getSessionCookie } from './get-session-cookie.util';
import { UserModel } from 'src/users/models/user.model';
import { testKit } from './test-kit.util';

interface ExtraData {
    password: string;
    sessionCookie: string;
}

export async function createUser(): Promise<UserModel & ExtraData> {
    const user = testKit.userSeed.signUpInput;
    const res = await testKit.request.send(
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
