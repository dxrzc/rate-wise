import { getSessionCookie } from '@integration/utils/get-session-cookie.util';
import { getSidFromCookie } from '@integration/utils/get-sid-from-cookie.util';
import { PASSWORD_MAX_LENGTH } from 'src/auth/constants/auth.constants';
import { createQuery } from '@integration/utils/create-query.util';
import { createUser } from '@integration/utils/create-user.util';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { signOutAllQuery } from '@queries/sign-out-all.query';
import { testKit } from '@integration/utils/test-kit.util';
import { signInQuery } from '@queries/sign-in.query';
import { Code } from '@integration/enum/code.enum';
import * as request from 'supertest';
import { faker } from '@faker-js/faker/.';

describe('signOutAll', () => {
    describe('Session Cookie not provided', () => {
        test('return UNAUTHORIZED code and UNAUTHORIZED message', async () => {
            await expect(
                request(testKit.app.getHttpServer())
                    .post('/graphql')
                    .send(createQuery(signOutAllQuery, { password: '123' })),
            ).resolves.toFailWith(
                Code.UNAUTHENTICATED,
                AUTH_MESSAGES.UNAUTHORIZED,
            );
        });
    });

    describe('Invalid password length (wiring test)', () => {
        test('should return BAD REQUEST and "Bad Request Exception" message', async () => {
            // sign up
            const { sessionCookie } = await createUser();
            // sign out all
            const badPassword = faker.internet.password({
                length: PASSWORD_MAX_LENGTH + 1,
            });
            const res = await request(testKit.app.getHttpServer())
                .post('/graphql')
                .set('Cookie', sessionCookie)
                .send(createQuery(signOutAllQuery, { password: badPassword }));
            expect(res).toFailWith(Code.BAD_REQUEST, 'Bad Request Exception');
        });
    });

    describe('Successful signOutAll', () => {
        test("delete all the user's session cookies from redis ", async () => {
            // sign up
            const { email, password, sessionCookie } = await createUser();
            const sid1 = getSidFromCookie(sessionCookie);

            // sign in
            const signIn = await request(testKit.app.getHttpServer())
                .post('/graphql')
                .send(
                    createQuery(signInQuery, {
                        password,
                        email,
                    }),
                );
            expect(signIn).notToFail();
            const sid2 = getSidFromCookie(getSessionCookie(signIn));

            // check both sids exist in redis
            await expect(
                testKit.redisService.get(`session:${sid1}`),
            ).resolves.not.toBeNull();
            await expect(
                testKit.redisService.get(`session:${sid2}`),
            ).resolves.not.toBeNull();

            // sign out all
            const res = await request(testKit.app.getHttpServer())
                .post('/graphql')
                .set('Cookie', sessionCookie)
                .send(createQuery(signOutAllQuery, { password }));
            expect(res).notToFail();

            // sids don't exist anymore
            await expect(
                testKit.redisService.get(`session:${sid1}`),
            ).resolves.toBeNull();
            await expect(
                testKit.redisService.get(`session:${sid2}`),
            ).resolves.toBeNull();
        });
    });

    describe('Password does not match', () => {
        test('return BAD_REQUEST code and INVALID_CREDENTIALS message', async () => {
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
            ).resolves.toFailWith(
                Code.BAD_REQUEST,
                AUTH_MESSAGES.INVALID_CREDENTIALS,
            );
        });
    });
});
