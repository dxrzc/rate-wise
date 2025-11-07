import { faker } from '@faker-js/faker/.';
import { createAccount } from '@integration/utils/create-account.util';
import { getSessionCookie } from '@integration/utils/get-session-cookie.util';
import { getSidFromCookie } from '@integration/utils/get-sid-from-cookie.util';
import { success } from '@integration/utils/no-errors.util';
import { testKit } from '@integration/utils/test-kit.util';
import { signUp } from '@testing/tools/gql-operations/auth/sign-up.operation';
import { AUTH_LIMITS } from 'src/auth/constants/auth.constants';
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
        test('should set a session cookie in headers', async () => {
            const res = await testKit.gqlClient
                .send(signUp({ args: testKit.userSeed.signUpInput, fields: ['id'] }))
                .expect(success);
            expect(res).toContainCookie(testKit.authConfig.sessCookieName);
        });

        test('should create a set in Redis storing user sessions', async () => {
            const res = await testKit.gqlClient
                .send(signUp({ args: testKit.userSeed.signUpInput, fields: ['id'] }))
                .expect(success);
            const key = userSessionsSetKey(res.body.data.signUp.id as string);
            const sessSet = await testKit.sessionsRedisClient.setMembers(key);
            expect(sessSet.length).toBe(1);
            expect(sessSet[0]).toBe(getSidFromCookie(getSessionCookie(res)));
        });

        test('should create a "user-session" record in Redis', async () => {
            const res = await testKit.gqlClient
                .send(signUp({ args: testKit.userSeed.signUpInput, fields: ['id'] }))
                .expect(success);
            const sid = getSidFromCookie(getSessionCookie(res));
            const redisKey = userAndSessionRelationKey(sid);
            const sessionOwner = await testKit.sessionsRedisClient.get(redisKey);
            expect(sessionOwner).toBe(res.body.data.signUp.id);
        });

        describe('Session cookie provided', () => {
            test('old session should be removed from redis store (session rotation)', async () => {
                const { sessionCookie } = await createAccount();
                const oldSid = getSidFromCookie(sessionCookie);
                // send old cookie with sign up request
                await testKit.gqlClient.set('Cookie', sessionCookie).send(
                    signUp({
                        fields: ['id'],
                        args: testKit.userSeed.signUpInput,
                    }),
                );
                const redisKey = `${SESS_REDIS_PREFIX}:${oldSid}`;
                const sessionInRedis = await testKit.sessionsRedisClient.get(redisKey);
                expect(sessionInRedis).toBeNull();
            });
        });

        test(`default user roles should be "[${UserRole.USER}]"`, async () => {
            const user = testKit.userSeed.signUpInput;
            const res = await testKit.gqlClient
                .send(signUp({ args: user, fields: ['id'] }))
                .expect(success);
            const userId = res.body.data.signUp.id;
            const userDB = await testKit.userRepos.findOneByOrFail({ id: userId });
            expect(userDB.roles).toStrictEqual([UserRole.USER]);
        });

        test(`default account status should be "${AccountStatus.PENDING_VERIFICATION}"`, async () => {
            const user = testKit.userSeed.signUpInput;
            const res = await testKit.gqlClient
                .send(signUp({ args: user, fields: ['id'] }))
                .expect(success);
            const userId = res.body.data.signUp.id;
            const userDB = await testKit.userRepos.findOneByOrFail({ id: userId });
            expect(userDB.status).toBe(AccountStatus.PENDING_VERIFICATION);
        });

        test('user username should be stored as-is in database', async () => {
            const user = testKit.userSeed.signUpInput;
            const res = await testKit.gqlClient
                .send(signUp({ args: user, fields: ['id'] }))
                .expect(success);
            const userId = res.body.data.signUp.id;
            const userDB = await testKit.userRepos.findOneByOrFail({ id: userId });
            expect(userDB.username).toBe(user.username);
        });

        test('default reputation score should be 0', async () => {
            const user = testKit.userSeed.signUpInput;
            const res = await testKit.gqlClient
                .send(signUp({ args: user, fields: ['id'] }))
                .expect(success);
            const userId = res.body.data.signUp.id;
            const userDB = await testKit.userRepos.findOneByOrFail({ id: userId });
            expect(userDB.reputationScore).toBe(0);
        });

        test('user password should be hashed in database', async () => {
            const user = testKit.userSeed.signUpInput;
            const res = await testKit.gqlClient
                .send(signUp({ args: user, fields: ['id'] }))
                .expect(success);
            const userId = res.body.data.signUp.id;
            const { password } = await testKit.userRepos.findOneByOrFail({ id: userId });
            const hashingSvc = testKit.app.get(HashingService);
            const match = await hashingSvc.compare(user.password, password);
            expect(match).toBe(true);
        });

        test('user email should be stored as-is in database', async () => {
            const user = testKit.userSeed.signUpInput;
            const res = await testKit.gqlClient
                .send(signUp({ args: user, fields: ['id'] }))
                .expect(success);
            const userId = res.body.data.signUp.id;
            const userDB = await testKit.userRepos.findOneByOrFail({ id: userId });
            expect(userDB.email).toBe(user.email);
        });

        test('createdAt and updatedAt should be defined in database', async () => {
            const user = testKit.userSeed.signUpInput;
            const res = await testKit.gqlClient
                .send(signUp({ args: user, fields: ['id'] }))
                .expect(success);
            const userId = res.body.data.signUp.id;
            const userDB = await testKit.userRepos.findOneByOrFail({ id: userId });
            expect(userDB.createdAt).toBeDefined();
            expect(userDB.updatedAt).toBeDefined();
        });
    });

    describe('Email already exists', () => {
        test(`should return "${Code.CONFLICT}" code and "${USER_MESSAGES.ALREADY_EXISTS}" message`, async () => {
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

    describe('Password exceeds the max password length', () => {
        test(`should return "${Code.BAD_REQUEST}" code and "${COMMON_MESSAGES.INVALID_INPUT}" message`, async () => {
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

    describe('Attempt to provide password as a gql field', () => {
        test(`should return "${Code.GRAPHQL_VALIDATION_FAILED}" code`, async () => {
            const res = await testKit.gqlClient.send(
                signUp({
                    args: testKit.userSeed.signUpInput,
                    fields: ['password' as any],
                }),
            );
            expect(res).toFailWith(
                Code.GRAPHQL_VALIDATION_FAILED,
                'Cannot query field "password" on type "UserModel".',
            );
        });
    });

    describe('Username already exists', () => {
        test(`should return "${Code.CONFLICT}" code and "${USER_MESSAGES.ALREADY_EXISTS}" message`, async () => {
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

    describe('Successful sign up', () => {
        test('response data should match the user in database', async () => {
            const user = testKit.userSeed.signUpInput;
            const res = await testKit.gqlClient
                .send(signUp({ args: user, fields: 'ALL' }))
                .expect(success);
            const responseData = res.body.data.signUp;
            const userDb = await testKit.userRepos.findOneByOrFail({ id: responseData.id });
            expect(responseData).toStrictEqual({
                username: userDb?.username,
                reputationScore: userDb?.reputationScore,
                createdAt: userDb?.createdAt.toISOString(),
                updatedAt: userDb?.updatedAt.toISOString(),
                email: userDb?.email,
                status: userDb?.status.toUpperCase(),
                roles: userDb?.roles.map((role) => role.toUpperCase()),
                id: userDb?.id,
            });
        });
    });

    describe(`More than ${THROTTLE_CONFIG.CRITICAL.limit} attemps in ${THROTTLE_CONFIG.CRITICAL.ttl / 1000}s from the same ip`, () => {
        test(`should return "${Code.TOO_MANY_REQUESTS}" code and "${COMMON_MESSAGES.TOO_MANY_REQUESTS}" message`, async () => {
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
