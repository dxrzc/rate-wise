/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { makeUserSessionRelationKey } from 'src/auth/functions/make-user-session-relation-key';
import { makeSessionsIndexKey } from 'src/auth/functions/make-sessions-index-key';
import { getSidFromCookie } from '@integration/utils/get-sid-from-cookie.util';
import { getSessionCookie } from '@integration/utils/get-session-cookie.util';
import { USER_ALREADY_EXISTS } from 'src/users/messages/user.messages';
import { PASSWORD_MAX_LENGTH } from 'src/auth/constants/auth.constants';
import { createQuery } from '@integration/utils/create-query.util';
import { testKit } from '@integration/utils/test-kit.util';
import { signUpQuery } from '@queries/sign-up.query';
import { Code } from '@integration/enum/code.enum';
import { faker } from '@faker-js/faker/.';
import * as request from 'supertest';
import { createUser } from '@integration/utils/create-user.util';
import { UserModel } from 'src/users/models/user.model';

describe('signUp', () => {
    describe('Username already exists', () => {
        test('should return BAD REQUEST and USER_ALREADY_EXISTS message ', async () => {
            const username = testKit.userSeed.username;
            await request(testKit.app.getHttpServer())
                .post('/graphql')
                .send(
                    createQuery(signUpQuery, {
                        username,
                        email: testKit.userSeed.email,
                        password: testKit.userSeed.password,
                    }),
                );
            const res = await request(testKit.app.getHttpServer())
                .post('/graphql')
                .send(
                    createQuery(signUpQuery, {
                        username,
                        email: testKit.userSeed.email,
                        password: testKit.userSeed.password,
                    }),
                );
            expect(res).toFailWith(Code.BAD_REQUEST, USER_ALREADY_EXISTS);
        });
    });

    describe('Email already exists', () => {
        test('should return BAD REQUEST and USER_ALREADY_EXISTS message', async () => {
            const email = testKit.userSeed.email;
            await request(testKit.app.getHttpServer())
                .post('/graphql')
                .send(
                    createQuery(signUpQuery, {
                        email,
                        username: testKit.userSeed.username,
                        password: testKit.userSeed.password,
                    }),
                );
            const res = await request(testKit.app.getHttpServer())
                .post('/graphql')
                .send(
                    createQuery(signUpQuery, {
                        email,
                        username: testKit.userSeed.username,
                        password: testKit.userSeed.password,
                    }),
                );
            expect(res).toFailWith(Code.BAD_REQUEST, USER_ALREADY_EXISTS);
        });
    });

    test('created user should contain the expected values in db', async () => {
        const user = testKit.userSeed.signUpInput;
        const res = await request(testKit.app.getHttpServer())
            .post('/graphql')
            .send(createQuery(signUpQuery, user));
        expect(res).notToFail();
        const userId = res.body.data.signUp.id as string;
        const userDB = await testKit.userRepos.findOneBy({ id: userId });
        expect(userDB).not.toBeNull();
        expect(userDB!.role).toBe('user');
        expect(userDB!.reputationScore).toBe(0);
        expect(userDB!.email).toBe(user.email);
        expect(userDB!.username).toBe(user.username);
        expect(userDB!.password).not.toBe(user.password); // hashed
        expect(userDB!.createdAt).toBeDefined();
        expect(userDB!.updatedAt).toBeDefined();
    });

    describe('Password exceeds the max password length (wiring test)', () => {
        test('should return BAD REQUEST and "Bad Request Exception" message', async () => {
            const res = await request(testKit.app.getHttpServer())
                .post('/graphql')
                .send(
                    createQuery(signUpQuery, {
                        ...testKit.userSeed.signUpInput,
                        password: faker.internet.password({
                            length: PASSWORD_MAX_LENGTH + 1,
                        }),
                    }),
                );
            expect(res).toFailWith(Code.BAD_REQUEST, 'Bad Request Exception');
        });
    });

    describe('Successful sign-up', () => {
        test('response data should match the created user in database', async () => {
            // create user
            const user = testKit.userSeed.signUpInput;
            const res = await request(testKit.app.getHttpServer())
                .post('/graphql')
                .send(createQuery(signUpQuery, user));
            expect(res).notToFail();
            const responseData = res.body.data.signUp as UserModel;
            // user in db
            const userDb = await testKit.userRepos.findOneBy({
                id: responseData.id,
            });
            expect(userDb).not.toBeNull();
            // data should match
            expect(responseData).toStrictEqual({
                username: userDb?.username,
                reputationScore: userDb?.reputationScore,
                createdAt: userDb?.createdAt.toISOString(),
                updatedAt: userDb?.updatedAt.toISOString(),
                email: userDb?.email,
                role: userDb?.role,
                id: userDb?.id,
            });
        });

        test.only('user password can not be queried from the response data', async () => {
            const res = await request(testKit.app.getHttpServer())
                .post('/graphql')
                .send(
                    createQuery(
                        `mutation SignUp($input: SignUpInput!) {
                          signUp(user_data: $input) {
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
                        testKit.userSeed.signUpInput,
                    ),
                );
            expect(res).toFailWith(
                Code.GRAPHQL_VALIDATION_FAILED,
                'Cannot query field "password" on type "UserModel".',
            );
        });

        test('should set a session cookie', async () => {
            const res = await request(testKit.app.getHttpServer())
                .post('/graphql')
                .send(createQuery(signUpQuery, testKit.userSeed.signUpInput));
            expect(res).notToFail();
            expect(res).toContainCookie(testKit.sessConfig.cookieName);
        });

        test('should create user-sessions index redis set', async () => {
            const res = await request(testKit.app.getHttpServer())
                .post('/graphql')
                .send(createQuery(signUpQuery, testKit.userSeed.signUpInput));
            expect(res).notToFail();
            const key = makeSessionsIndexKey(res.body.data.signUp.id as string);
            const sessSet = await testKit.redisService.setMembers(key);
            expect(sessSet.length).toBe(1);
            expect(sessSet[0]).toBe(getSidFromCookie(getSessionCookie(res)));
        });

        test('should create session-user relation record in redis', async () => {
            const res = await request(testKit.app.getHttpServer())
                .post('/graphql')
                .send(createQuery(signUpQuery, testKit.userSeed.signUpInput));
            expect(res).notToFail();
            const sid = getSidFromCookie(getSessionCookie(res));
            const key = makeUserSessionRelationKey(sid);
            const sessionOwner = await testKit.redisService.get(key);
            expect(sessionOwner).toBe(res.body.data.signUp.id);
        });
    });

    describe('Session cookie is provided', () => {
        describe('SignUp success', () => {
            test('old session should be removed from redis store (session rotation)', async () => {
                //  old session
                const { sessionCookie } = await createUser();
                const oldSid = getSidFromCookie(sessionCookie);
                // new session (by signing up)
                await request(testKit.app.getHttpServer())
                    .post('/graphql')
                    .set('Cookie', sessionCookie)
                    .send(
                        createQuery(signUpQuery, testKit.userSeed.signUpInput),
                    );
                // old session was deleted
                await expect(
                    testKit.redisService.get(`session:${oldSid}`),
                ).resolves.toBeNull();
            });
        });
    });
});
