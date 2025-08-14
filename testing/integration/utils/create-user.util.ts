/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import * as request from 'supertest';
import { testKit } from './test-kit.util';
import { createQuery } from './create-query.util';
import { signUpQuery } from '@queries/sign-up.query';
import { UserModel } from 'src/users/models/user.model';
import { getSessionCookie } from './get-session-cookie.util';

interface ExtraData {
    password: string;
    sessionCookie: string;
}

export async function createUser(): Promise<UserModel & ExtraData> {
    const user = testKit.userSeed.signUpInput;
    const res = await request(testKit.app.getHttpServer())
        .post('/graphql')
        .send(createQuery(signUpQuery, user));
    return {
        ...(res.body.data.signUp as UserModel),
        password: user.password,
        sessionCookie: getSessionCookie(res),
    };
}
