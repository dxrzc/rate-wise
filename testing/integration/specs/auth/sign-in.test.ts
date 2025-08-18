/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { makeUserSessionRelationKey } from 'src/auth/functions/make-user-session-relation-key';
import { makeSessionsIndexKey } from 'src/auth/functions/make-sessions-index-key';
import { getSidFromCookie } from '@integration/utils/get-sid-from-cookie.util';
import { getSessionCookie } from '@integration/utils/get-session-cookie.util';
import { PASSWORD_MAX_LENGTH } from 'src/auth/constants/auth.constants';
import { createQuery } from '@integration/utils/create-query.util';
import { createUser } from '@integration/utils/create-user.util';
import { testKit } from '@integration/utils/test-kit.util';
import { signInQuery } from '@queries/sign-in.query';
import { Code } from '@integration/enum/code.enum';
import { faker } from '@faker-js/faker/.';
import * as request from 'supertest';
import {
    INVALID_CREDENTIALS,
    MAX_SESSIONS_REACHED,
} from 'src/auth/constants/errors.constants';

describe('signIn', () => {
    describe('Successful sign-in', () => {
        test('data should match the user data in database', async () => {
            // sign up
            const { email, password, id } = await createUser();
            // sign in
            const res = await request(testKit.app.getHttpServer())
                .post('/graphql')
                .send(
                    createQuery(signInQuery, {
                        password,
                        email,
                    }),
                );
            expect(res).notToFail();
            // find user in db
            const userDb = await testKit.userRepos.findOneBy({
                id,
            });
            expect(userDb).not.toBeNull();
            // data should match
            expect(res.body.data.signIn).toStrictEqual({
                username: userDb?.username,
                reputationScore: userDb?.reputationScore,
                createdAt: userDb?.createdAt.toISOString(),
                updatedAt: userDb?.updatedAt.toISOString(),
                email: userDb?.email,
                role: userDb?.role.toUpperCase(),
                id: userDb?.id,
            });
        });

        test('user password can not be queried from the response data', async () => {
            // sign up
            const { email, password } = await createUser();
            // sign in
            const res = await request(testKit.app.getHttpServer())
                .post('/graphql')
                .send(
                    createQuery(
                        `mutation SignIn($input: SignInInput!) {
                          signIn(credentials: $input) {
                            id
                            createdAt
                            updatedAt
                            username
                            email
                            role
                            reputationScore
                            password
                          }
                        }`,
                        {
                            password,
                            email,
                        },
                    ),
                );
            expect(res).toFailWith(
                Code.GRAPHQL_VALIDATION_FAILED,
                'Cannot query field "password" on type "UserModel".',
            );
        });

        test('should set a session cookie', async () => {
            const { email, password } = await createUser();
            const res = await request(testKit.app.getHttpServer())
                .post('/graphql')
                .send(
                    createQuery(signInQuery, {
                        password,
                        email,
                    }),
                );
            expect(res).notToFail();
            expect(res).toContainCookie(testKit.sessConfig.cookieName);
        });

        test('should add the new session to the user sessions index redis set', async () => {
            const { email, password } = await createUser();
            const res = await request(testKit.app.getHttpServer())
                .post('/graphql')
                .send(
                    createQuery(signInQuery, {
                        password,
                        email,
                    }),
                );
            expect(res).notToFail();
            const key = makeSessionsIndexKey(res.body.data.signIn.id as string);
            const sessSet = await testKit.redisService.setMembers(key);
            expect(sessSet.length).toBe(2); // signUp and signIn
            expect(
                sessSet.find(
                    (key) => key === getSidFromCookie(getSessionCookie(res)),
                ),
            ).toBeDefined();
        });

        test('should create session-user relation record in redis', async () => {
            const { email, password } = await createUser();
            const res = await request(testKit.app.getHttpServer())
                .post('/graphql')
                .send(
                    createQuery(signInQuery, {
                        password,
                        email,
                    }),
                );
            expect(res).notToFail();
            const sid = getSidFromCookie(getSessionCookie(res));
            const key = makeUserSessionRelationKey(sid);
            const sessionOwner = await testKit.redisService.get(key);
            expect(sessionOwner).toBe(res.body.data.signIn.id);
        });
    });

    describe('Invalid password length (wiring test)', () => {
        test('should return BAD REQUEST and "Bad Request Exception" message', async () => {
            const invalidPassword = faker.internet.password({
                length: PASSWORD_MAX_LENGTH + 1,
            });
            const res = await request(testKit.app.getHttpServer())
                .post('/graphql')
                .send(
                    createQuery(signInQuery, {
                        password: invalidPassword,
                        email: testKit.userSeed.email,
                    }),
                );
            expect(res).toFailWith(Code.BAD_REQUEST, 'Bad Request Exception');
        });
    });

    describe('Password does not match', () => {
        test('should return BAD REQUEST and INVALID_CREDENTIALS message', async () => {
            const { email } = await createUser();
            const res = await request(testKit.app.getHttpServer())
                .post('/graphql')
                .send(
                    createQuery(signInQuery, {
                        password: testKit.userSeed.password,
                        email,
                    }),
                );
            expect(res).toFailWith(Code.BAD_REQUEST, INVALID_CREDENTIALS);
        });
    });

    describe('User in email does not exist', () => {
        test('should return BAD REQUEST and INVALID_CREDENTIALS message', async () => {
            const res = await request(testKit.app.getHttpServer())
                .post('/graphql')
                .send(
                    createQuery(signInQuery, {
                        password: testKit.userSeed.password,
                        email: testKit.userSeed.email,
                    }),
                );
            expect(res).toFailWith(Code.BAD_REQUEST, INVALID_CREDENTIALS);
        });
    });

    describe('User exceeds the maximum active sessions', () => {
        test('should return BAD REQUEST and MAX_SESSIONS_REACHED message', async () => {
            const maxSessions = testKit.sessConfig.maxUserSessions;
            const { email, password } = await createUser(); // 1 session
            for (let i = 0; i < maxSessions - 1; i++) {
                await expect(
                    request(testKit.app.getHttpServer()).post('/graphql').send(
                        createQuery(signInQuery, {
                            password,
                            email,
                        }),
                    ),
                ).resolves.notToFail();
            }
            const res = await request(testKit.app.getHttpServer())
                .post('/graphql')
                .send(
                    createQuery(signInQuery, {
                        password,
                        email,
                    }),
                );
            expect(res).toFailWith(Code.BAD_REQUEST, MAX_SESSIONS_REACHED);
        });
    });

    describe('Session cookie is provided', () => {
        describe('SignIn success', () => {
            test('old session should be removed from redis store (session rotation)', async () => {
                const { sessionCookie, email, password } = await createUser();
                const oldSid = getSidFromCookie(sessionCookie);
                await request(testKit.app.getHttpServer())
                    .post('/graphql')
                    .set('Cookie', sessionCookie)
                    .send(
                        createQuery(signInQuery, {
                            email,
                            password,
                        }),
                    );
                await expect(
                    testKit.redisService.get(`session:${oldSid}`),
                ).resolves.toBeNull();
            });
        });
    });
});
