/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { makeUserSessionRelationKey } from 'src/sessions/functions/make-user-session-relation-key';
import { makeSessionsIndexKey } from 'src/sessions/functions/make-sessions-index-key';
import { getSidFromCookie } from '@integration/utils/get-sid-from-cookie.util';
import { getSessionCookie } from '@integration/utils/get-session-cookie.util';
import { signIn } from '@test-utils/operations/auth/sign-in.operation';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';
import { createUser } from '@integration/utils/create-user.util';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { AUTH_LIMITS } from 'src/auth/constants/auth.constants';
import { testKit } from '@integration/utils/test-kit.util';
import { Code } from 'src/common/enum/code.enum';
import { faker } from '@faker-js/faker/.';

describe('signIn', () => {
    describe('Successful sign-in', () => {
        test('returned data should match the user data in database', async () => {
            const { email, password, id } = await createUser();
            const res = await testKit.request.send(
                signIn({
                    input: { email, password },
                    fields: 'ALL',
                }),
            );
            const userDb = await testKit.userRepos.findOneByOrFail({ id });
            expect(res.body.data.signIn).toStrictEqual({
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
            const { email, password } = await createUser();
            const res = await testKit.request.send(
                signIn({
                    input: { email, password },
                    fields: ['id'],
                }),
            );
            expect(res).notToFail();
            expect(res).toContainCookie(testKit.authConfig.sessCookieName);
        });

        test('should add the new session to the user sessions index redis set', async () => {
            const { email, password } = await createUser();
            const res = await testKit.request.send(
                signIn({
                    input: { email, password },
                    fields: ['id'],
                }),
            );
            expect(res).notToFail();
            const key = makeSessionsIndexKey(res.body.data.signIn.id);
            const sessId = getSidFromCookie(getSessionCookie(res));
            const sessSet = await testKit.authRedis.sMembers(key);
            expect(sessSet.length).toBe(2); // signUp and signIn
            expect(sessSet.find((key) => key === sessId)).toBeDefined();
        });

        test('should create session-user relation record in redis', async () => {
            const { email, password } = await createUser();
            const res = await testKit.request.send(
                signIn({
                    input: { email, password },
                    fields: ['id'],
                }),
            );
            expect(res).notToFail();
            const sid = getSidFromCookie(getSessionCookie(res));
            const key = makeUserSessionRelationKey(sid);
            const sessionOwner = await testKit.authRedis.get(key);
            expect(sessionOwner).toBe(res.body.data.signIn.id);
        });
    });

    describe('Invalid password length (wiring test)', () => {
        test('should return BAD REQUEST code and INVALID_INPUT message', async () => {
            const res = await testKit.request.send(
                signIn({
                    fields: ['id'],
                    input: {
                        email: testKit.userSeed.email,
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

    describe('Password does not match', () => {
        test('should return BAD REQUEST code and INVALID_CREDENTIALS message', async () => {
            const { email } = await createUser();
            const res = await testKit.request.send(
                signIn({
                    input: { email, password: testKit.userSeed.password },
                    fields: ['id'],
                }),
            );
            expect(res).toFailWith(
                Code.BAD_REQUEST,
                AUTH_MESSAGES.INVALID_CREDENTIALS,
            );
        });
    });

    describe('User in email does not exist', () => {
        test('should return BAD REQUEST code and INVALID_CREDENTIALS message', async () => {
            const res = await testKit.request.send(
                signIn({
                    fields: ['id'],
                    input: {
                        email: testKit.userSeed.email,
                        password: testKit.userSeed.password,
                    },
                }),
            );
            expect(res).toFailWith(
                Code.BAD_REQUEST,
                AUTH_MESSAGES.INVALID_CREDENTIALS,
            );
        });
    });

    describe('User exceeds the maximum active sessions', () => {
        test('should return BAD REQUEST code and MAX_SESSIONS_REACHED message', async () => {
            const maxSessions = testKit.authConfig.maxUserSessions;
            const { email, password } = await createUser(); // 1 session
            for (let i = 0; i < maxSessions - 1; i++) {
                await expect(
                    testKit.request.send(
                        signIn({
                            input: { email, password },
                            fields: ['id'],
                        }),
                    ),
                ).resolves.notToFail();
            }
            const res = await testKit.request.send(
                signIn({
                    input: { email, password },
                    fields: ['id'],
                }),
            );
            expect(res).toFailWith(
                Code.BAD_REQUEST,
                AUTH_MESSAGES.MAX_SESSIONS_REACHED,
            );
        });
    });

    describe('Session cookie is provided', () => {
        describe('SignIn success', () => {
            test('old session should be removed from redis store (session rotation)', async () => {
                const { sessionCookie, email, password } = await createUser();
                const oldSid = getSidFromCookie(sessionCookie);
                await testKit.request.set('Cookie', sessionCookie).send(
                    signIn({
                        input: { email, password },
                        fields: ['id'],
                    }),
                );
                await expect(
                    testKit.authRedis.get(`session:${oldSid}`),
                ).resolves.toBeNull();
            });
        });
    });

    describe('Password queried in graphql operation', () => {
        test('should failed with graphql validation error', async () => {
            const { email, password } = await createUser();
            const res = await testKit.request.send(
                signIn({
                    input: { email, password },
                    fields: ['password' as any],
                }),
            );
            expect(res).toFailWith(
                Code.GRAPHQL_VALIDATION_FAILED,
                <string>expect.any(String),
            );
        });
    });
});
