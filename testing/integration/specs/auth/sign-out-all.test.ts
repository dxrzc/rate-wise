import {
    AUTHENTICATION_REQUIRED,
    INVALID_CREDENTIALS,
} from 'src/auth/constants/errors.constants';
import { createQuery } from '@integration/utils/create-query.util';
import { createUser } from '@integration/utils/create-user.util';
import { signOutAllQuery } from '@queries/sign-out-all.query';
import { testKit } from '@integration/utils/test-kit.util';
import { Code } from '@integration/enum/code.enum';
import * as request from 'supertest';

describe('signOutAll', () => {
    describe('Session Cookie not provided', () => {
        test('return UNAUTHORIZED and AUTHENTICATION_REQUIRED message', async () => {
            await expect(
                request(testKit.app.getHttpServer())
                    .post('/graphql')
                    .send(createQuery(signOutAllQuery, { password: '123' })),
            ).resolves.toFailWith(
                Code.UNAUTHENTICATED,
                AUTHENTICATION_REQUIRED,
            );
        });
    });

    describe('Password does not match', () => {
        test('return BAD_REQUEST and INVALID_CREDENTIALS message', async () => {
            const { sessionCookie } = await createUser();
            await expect(
                request(testKit.app.getHttpServer())
                    .post('/graphql')
                    .set('Cookie', sessionCookie)
                    .send(
                        createQuery(signOutAllQuery, {
                            password: testKit.userSeed.password,
                        }),
                    ),
            ).resolves.toFailWith(Code.BAD_REQUEST, INVALID_CREDENTIALS);
        });
    });
});
