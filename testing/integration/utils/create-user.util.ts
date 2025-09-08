/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import * as request from 'supertest';
import { testKit } from './test-kit.util';
import { UserModel } from 'src/users/models/user.model';
import { getSessionCookie } from './get-session-cookie.util';
import { signUp } from '@test-utils/operations/auth/sign-up.operation';

interface ExtraData {
    password: string;
    sessionCookie: string;
}

export async function createUser(): Promise<UserModel & ExtraData> {
    const user = testKit.userSeed.signUpInput;
    const res = await request(testKit.app.getHttpServer())
        .post('/graphql')
        .send(
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
