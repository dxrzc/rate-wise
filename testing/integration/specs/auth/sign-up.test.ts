/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { makeUserSessionRelationKey } from 'src/auth/functions/make-user-session-relation-key';
import { makeSessionsIndexKey } from 'src/auth/functions/make-sessions-index-key';
import { getSidFromCookie } from '@integration/utils/get-sid-from-cookie.util';
import { getSessionCookie } from '@integration/utils/get-session-cookie.util';
import { signUp } from '@test-utils/operations/auth/sign-up.operation';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';
import { createUser } from '@integration/utils/create-user.util';
import { USER_MESSAGES } from 'src/users/messages/user.messages';
import { AUTH_LIMITS } from 'src/auth/constants/auth.constants';
import { UserStatus } from 'src/users/enum/user-status.enum';
import { testKit } from '@integration/utils/test-kit.util';
import { UserRole } from 'src/users/enum/user-role.enum';
import { UserModel } from 'src/users/models/user.model';
import { Code } from 'src/common/enum/code.enum';
import { faker } from '@faker-js/faker/.';

describe('signUp', () => {
    describe('Successful signUp', () => {
        test('created user should contain the expected values in db', async () => {
            const user = testKit.userSeed.signUpInput;
            const res = await testKit.request.send(
                signUp({ input: user, fields: ['id'] }),
            );
            const userId = res.body.data.signUp.id;
            const userDB = await testKit.userRepos.findOneByOrFail({
                id: userId,
            });
            expect(userDB.role).toBe(UserRole.USER); // default
            expect(userDB.reputationScore).toBe(0);
            expect(userDB.email).toBe(user.email);
            expect(userDB.username).toBe(user.username);
            expect(userDB.password).not.toBe(user.password); // hashed
            expect(userDB.createdAt).toBeDefined();
            expect(userDB.updatedAt).toBeDefined();
            expect(userDB.status).toBe(UserStatus.PENDING_VERIFICATION); // default
        });

        test('response data should match the created user in database', async () => {
            const user = testKit.userSeed.signUpInput;
            const res = await testKit.request.send(
                signUp({ input: user, fields: 'ALL' }),
            );
            expect(res).notToFail();
            const responseData = res.body.data.signUp as UserModel;
            const userDb = await testKit.userRepos.findOneByOrFail({
                id: responseData.id,
            });
            expect(responseData).toStrictEqual({
                username: userDb?.username,
                reputationScore: userDb?.reputationScore,
                createdAt: userDb?.createdAt.toISOString(),
                updatedAt: userDb?.updatedAt.toISOString(),
                email: userDb?.email,
                status: userDb?.status.toUpperCase(),
                role: userDb?.role.toUpperCase(),
                id: userDb?.id,
            });
        });

        test('should set a session cookie', async () => {
            const res = await testKit.request.send(
                signUp({ input: testKit.userSeed.signUpInput, fields: ['id'] }),
            );
            expect(res).notToFail();
            expect(res).toContainCookie(testKit.authConfig.sessCookieName);
        });

        test('should create user-sessions index redis set', async () => {
            const res = await testKit.request.send(
                signUp({ input: testKit.userSeed.signUpInput, fields: ['id'] }),
            );
            expect(res).notToFail();
            const key = makeSessionsIndexKey(res.body.data.signUp.id as string);
            const sessSet = await testKit.redisService.setMembers(key);
            expect(sessSet.length).toBe(1);
            expect(sessSet[0]).toBe(getSidFromCookie(getSessionCookie(res)));
        });

        test('should create session-user relation record in redis', async () => {
            const res = await testKit.request.send(
                signUp({ input: testKit.userSeed.signUpInput, fields: ['id'] }),
            );
            expect(res).notToFail();
            const sid = getSidFromCookie(getSessionCookie(res));
            const key = makeUserSessionRelationKey(sid);
            const sessionOwner = await testKit.redisService.get(key);
            expect(sessionOwner).toBe(res.body.data.signUp.id);
        });
    });

    describe('Username already exists', () => {
        test('should return BAD REQUEST code and ALREADY_EXISTS message ', async () => {
            const { username } = await createUser();
            const res = await testKit.request.send(
                signUp({
                    fields: ['id'],
                    input: {
                        username,
                        email: testKit.userSeed.email,
                        password: testKit.userSeed.password,
                    },
                }),
            );
            expect(res).toFailWith(
                Code.BAD_REQUEST,
                USER_MESSAGES.ALREADY_EXISTS,
            );
        });
    });

    describe('Email already exists', () => {
        test('should return BAD REQUEST code and ALREADY_EXISTS message', async () => {
            const { email } = await createUser();
            const res = await testKit.request.send(
                signUp({
                    fields: ['id'],
                    input: {
                        email,
                        username: testKit.userSeed.username,
                        password: testKit.userSeed.password,
                    },
                }),
            );
            expect(res).toFailWith(
                Code.BAD_REQUEST,
                USER_MESSAGES.ALREADY_EXISTS,
            );
        });
    });

    describe('Password exceeds the max password length (wiring test)', () => {
        test('should return BAD REQUEST code and INVALID_INPUT message', async () => {
            const res = await testKit.request.send(
                signUp({
                    fields: ['id'],
                    input: {
                        ...testKit.userSeed.signUpInput,
                        password: faker.internet.password({
                            length: AUTH_LIMITS.PASSWORD.MAX + 1,
                        }),
                    },
                }),
            );
            expect(res).toFailWith(
                Code.BAD_REQUEST,
                COMMON_MESSAGES.INVALID_INPUT,
            );
        });
    });

    describe('Password queried in graphql operation', () => {
        test('user password can not be queried from the response data', async () => {
            const res = await testKit.request.send(
                signUp({
                    input: testKit.userSeed.signUpInput,
                    fields: ['password' as any],
                }),
            );
            expect(res).toFailWith(
                Code.GRAPHQL_VALIDATION_FAILED,
                'Cannot query field "password" on type "UserModel".',
            );
        });
    });

    describe('Session cookie is provided', () => {
        describe('SignUp success', () => {
            test('old session should be removed from redis store (session rotation)', async () => {
                //  old session
                const { sessionCookie } = await createUser();
                const oldSid = getSidFromCookie(sessionCookie);
                // new session (by signing up)
                await testKit.request.set('Cookie', sessionCookie).send(
                    signUp({
                        fields: ['id'],
                        input: testKit.userSeed.signUpInput,
                    }),
                );
                // old session is deleted
                await expect(
                    testKit.redisService.get(`session:${oldSid}`),
                ).resolves.toBeNull();
            });
        });
    });
});
