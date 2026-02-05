import { faker } from '@faker-js/faker/.';
import { createAccount } from '@integration/utils/create-account.util';
import { getSessionCookie } from '@integration/utils/get-session-cookie.util';
import { getSidFromCookie } from '@integration/utils/get-sid-from-cookie.util';
import { success } from '@integration/utils/no-errors.util';
import { testKit } from '@integration/utils/test-kit.util';
import { signUp } from '@testing/tools/gql-operations/auth/sign-up.operation';
import { AUTH_LIMITS } from 'src/auth/constants/auth.limits';
import { THROTTLE_CONFIG } from 'src/common/constants/throttle.config.constants';
import { Code } from 'src/common/enum/code.enum';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';
import { HashingService } from 'src/common/services/hashing.service';
import { SESS_REDIS_PREFIX } from 'src/sessions/constants/sessions.constants';
import { userSessionsSetKey } from 'src/sessions/functions/sessions-index-key';
import { userAndSessionRelationKey } from 'src/sessions/functions/user-session-relation-key';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { UserRole } from 'src/users/enums/user-role.enum';
import { USER_MESSAGES } from 'src/users/messages/user.messages';

describe('GraphQL - signUp', () => {
    describe('Successful sign up', () => {
        test('session cookie is set in headers', async () => {
            const res = await testKit.gqlClient
                .send(signUp({ args: testKit.userSeed.signUpInput, fields: ['id'] }))
                .expect(success);
            expect(res).toContainCookie(testKit.authConfig.sessCookieName);
        });

        test('session is stored in redis', async () => {
            const res = await testKit.gqlClient
                .send(signUp({ args: testKit.userSeed.signUpInput, fields: ['id'] }))
                .expect(success);
            const sid = getSidFromCookie(getSessionCookie(res));
            const redisKey = `${SESS_REDIS_PREFIX}${sid}`;
            const sessionInRedis = await testKit.sessionsRedisClient.get(redisKey);
            expect(sessionInRedis).not.toBeNull();
        });

        test('user sessions redis set is created containing the new session', async () => {
            const res = await testKit.gqlClient
                .send(signUp({ args: testKit.userSeed.signUpInput, fields: ['id'] }))
                .expect(success);
            const key = userSessionsSetKey(res.body.data.signUp.id as string);
            const sessSet = await testKit.sessionsRedisClient.setMembers(key);
            expect(sessSet.length).toBe(1);
            expect(sessSet[0]).toBe(getSidFromCookie(getSessionCookie(res)));
        });

        test('user-session relation record is created in Redis', async () => {
            const res = await testKit.gqlClient
                .send(signUp({ args: testKit.userSeed.signUpInput, fields: ['id'] }))
                .expect(success);
            const sid = getSidFromCookie(getSessionCookie(res));
            const redisKey = userAndSessionRelationKey(sid);
            const sessionOwner = await testKit.sessionsRedisClient.get(redisKey);
            expect(sessionOwner).toBe(res.body.data.signUp.id);
        });

        describe('Session cookie provided', () => {
            test('old session is removed from redis store (session rotation)', async () => {
                const { sessionCookie } = await createAccount();
                const oldSid = getSidFromCookie(sessionCookie);
                const redisKey = `${SESS_REDIS_PREFIX}${oldSid}`;
                await expect(testKit.sessionsRedisClient.get(redisKey)).resolves.not.toBeNull();
                // send old cookie with sign up request
                await testKit.gqlClient.set('Cookie', sessionCookie).send(
                    signUp({
                        fields: ['id'],
                        args: testKit.userSeed.signUpInput,
                    }),
                );
                const sessionInRedis = await testKit.sessionsRedisClient.get(redisKey);
                expect(sessionInRedis).toBeNull();
            });
        });

        test('default user roles are reviewer and creator', async () => {
            const user = testKit.userSeed.signUpInput;
            const res = await testKit.gqlClient
                .send(signUp({ args: user, fields: ['id'] }))
                .expect(success);
            const userId = res.body.data.signUp.id;
            const userDB = await testKit.userRepos.findOneByOrFail({ id: userId });
            expect(userDB.roles).toStrictEqual([UserRole.REVIEWER, UserRole.CREATOR]);
        });

        test('default account status is pending verification', async () => {
            const user = testKit.userSeed.signUpInput;
            const res = await testKit.gqlClient
                .send(signUp({ args: user, fields: ['id'] }))
                .expect(success);
            const userId = res.body.data.signUp.id;
            const userDB = await testKit.userRepos.findOneByOrFail({ id: userId });
            expect(userDB.status).toBe(AccountStatus.PENDING_VERIFICATION);
        });

        describe('Username is sent with no extra white spaces', () => {
            test('user username is stored as-is in database', async () => {
                const user = testKit.userSeed.signUpInput;
                const res = await testKit.gqlClient
                    .send(signUp({ args: user, fields: ['id'] }))
                    .expect(success);
                const userId = res.body.data.signUp.id;
                const userDB = await testKit.userRepos.findOneByOrFail({ id: userId });
                expect(userDB.username).toBe(user.username);
            });
        });

        test('user password is hashed in database', async () => {
            const user = testKit.userSeed.signUpInput;
            const res = await testKit.gqlClient
                .send(signUp({ args: user, fields: ['id'] }))
                .expect(success);
            const userId = res.body.data.signUp.id;
            const { passwordHash } = await testKit.userRepos.findOneByOrFail({ id: userId });
            const hashingSvc = testKit.app.get(HashingService);
            const match = await hashingSvc.compare(user.password, passwordHash);
            expect(match).toBe(true);
        });

        test('user email is stored as-is in database', async () => {
            const user = testKit.userSeed.signUpInput;
            const res = await testKit.gqlClient
                .send(signUp({ args: user, fields: ['id'] }))
                .expect(success);
            const userId = res.body.data.signUp.id;
            const userDB = await testKit.userRepos.findOneByOrFail({ id: userId });
            expect(userDB.email).toBe(user.email);
        });

        test('createdAt and updatedAt are defined in database', async () => {
            const user = testKit.userSeed.signUpInput;
            const res = await testKit.gqlClient
                .send(signUp({ args: user, fields: ['id'] }))
                .expect(success);
            const userId = res.body.data.signUp.id;
            const userDB = await testKit.userRepos.findOneByOrFail({ id: userId });
            expect(userDB.createdAt).toBeDefined();
            expect(userDB.updatedAt).toBeDefined();
        });

        test('response data match the user in database', async () => {
            const user = testKit.userSeed.signUpInput;
            const res = await testKit.gqlClient
                .send(signUp({ args: user, fields: 'ALL' }))
                .expect(success);
            const responseData = res.body.data.signUp;
            const userDb = await testKit.userRepos.findOneByOrFail({ id: responseData.id });
            expect(responseData).toStrictEqual({
                username: userDb?.username,
                createdAt: userDb?.createdAt.toISOString(),
                updatedAt: userDb?.updatedAt.toISOString(),
                email: userDb?.email,
                status: userDb?.status.toUpperCase(),
                roles: userDb?.roles.map((role) => role.toUpperCase()),
                id: userDb?.id,
            });
        });

        describe('Username contains leading and trailing white spaces', () => {
            test('spaces are stripped before saving in database', async () => {
                const name = `  ${faker.string.alpha({ length: AUTH_LIMITS.USERNAME.MIN })} `;
                const res = await testKit.gqlClient
                    .send(
                        signUp({
                            args: { ...testKit.userSeed.signUpInput, username: name },
                            fields: 'ALL',
                        }),
                    )
                    .expect(success);
                const responseData = res.body.data.signUp;
                const userDb = await testKit.userRepos.findOneByOrFail({ id: responseData.id });
                expect(userDb.username).toBe(name.trim());
            });
        });
    });

    describe('Email already exists', () => {
        test('return conflict code and already exists error message', async () => {
            const { email } = await createAccount();
            const res = await testKit.gqlClient.send(
                signUp({
                    args: { ...testKit.userSeed.signUpInput, email },
                    fields: ['id'],
                }),
            );
            expect(res).toFailWith(Code.CONFLICT, USER_MESSAGES.ALREADY_EXISTS);
        });
    });

    describe('Username already exists', () => {
        test('return conflict code and already exists error message', async () => {
            const { username } = await createAccount();
            const res = await testKit.gqlClient.send(
                signUp({
                    args: { ...testKit.userSeed.signUpInput, username },
                    fields: ['id'],
                }),
            );
            expect(res).toFailWith(Code.CONFLICT, USER_MESSAGES.ALREADY_EXISTS);
        });
    });

    describe('Password exceeds the max password length', () => {
        test('return bad request code and invalid input error message', async () => {
            const password = faker.internet.password({ length: AUTH_LIMITS.PASSWORD.MAX + 1 });
            const res = await testKit.gqlClient.send(
                signUp({
                    args: { ...testKit.userSeed.signUpInput, password },
                    fields: ['id'],
                }),
            );
            expect(res).toFailWith(Code.BAD_REQUEST, COMMON_MESSAGES.INVALID_INPUT);
        });
    });

    describe('Invalid email format', () => {
        test('return bad request code and invalid input error message', async () => {
            const badEmail = 'user@.com';
            const res = await testKit.gqlClient.send(
                signUp({
                    args: { ...testKit.userSeed.signUpInput, email: badEmail },
                    fields: ['id'],
                }),
            );
            expect(res).toFailWith(Code.BAD_REQUEST, COMMON_MESSAGES.INVALID_INPUT);
        });
    });

    describe('Attempt fetch password in gql', () => {
        test('return graphql validation failed code', async () => {
            const res = await testKit.gqlClient.send(
                signUp({
                    args: testKit.userSeed.signUpInput,
                    fields: ['password' as any],
                }),
            );
            expect(res).toFailWith(
                Code.GRAPHQL_VALIDATION_FAILED,
                'Cannot query field "password" on type "AccountModel".',
            );
        });
    });

    describe.each(['password', 'email', 'username'])('Property %s not provided', (prop: string) => {
        test('return bad user input code', async () => {
            const args: any = { ...testKit.userSeed.signUpInput };
            delete args[prop];
            const res = await testKit.gqlClient.send(
                signUp({
                    args,
                    fields: ['id'],
                }),
            );
            expect(res).toFailWith(Code.BAD_USER_INPUT, expect.stringContaining(prop));
        });
    });

    describe('More than allowed attempts from same ip', () => {
        test('return too many requests code and too many requests error message', async () => {
            const ip = faker.internet.ip();
            const userData = testKit.userSeed.signUpInput;
            const requests = Array.from({ length: THROTTLE_CONFIG.CRITICAL.limit }, () =>
                testKit.gqlClient
                    .set('X-Forwarded-For', ip)
                    .send(signUp({ args: userData, fields: ['id'] })),
            );
            await Promise.all(requests);
            const res = await testKit.gqlClient
                .set('X-Forwarded-For', ip)
                .send(signUp({ args: userData, fields: ['id'] }));
            expect(res).toFailWith(Code.TOO_MANY_REQUESTS, COMMON_MESSAGES.TOO_MANY_REQUESTS);
        });
    });
});
