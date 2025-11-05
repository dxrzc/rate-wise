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

describe('GraphQL - SignUp', () => {
    describe('Successful sign up', () => {
        test('should set a session cookie in headers', async () => {
            const res = await testKit.gqlClient
                .send(signUp({ args: testKit.userSeed.signUpInput, fields: ['id'] }))
                .expect(success);
            expect(res).toContainCookie(testKit.authConfig.sessCookieName);
        });
    });

    describe('Successful sign up', () => {
        test('should create user-sessions index redis set', async () => {
            const res = await testKit.gqlClient
                .send(signUp({ args: testKit.userSeed.signUpInput, fields: ['id'] }))
                .expect(success);
            const key = userSessionsSetKey(res.body.data.signUp.id as string);
            const sessSet = await testKit.sessionsRedisClient.setMembers(key);
            expect(sessSet.length).toBe(1);
            expect(sessSet[0]).toBe(getSidFromCookie(getSessionCookie(res)));
        });
    });

    describe('Successful sign up', () => {
        test('should create user-sessions index redis set', async () => {
            const res = await testKit.gqlClient
                .send(signUp({ args: testKit.userSeed.signUpInput, fields: ['id'] }))
                .expect(success);
            const redisKey = userSessionsSetKey(res.body.data.signUp.id as string);
            const sessSet = await testKit.sessionsRedisClient.setMembers(redisKey);
            expect(sessSet.length).toBe(1);
            expect(sessSet[0]).toBe(getSidFromCookie(getSessionCookie(res)));
        });
    });

    describe('Successful sign up', () => {
        test('should create session-user relation record in redis', async () => {
            const res = await testKit.gqlClient
                .send(signUp({ args: testKit.userSeed.signUpInput, fields: ['id'] }))
                .expect(success);
            const sid = getSidFromCookie(getSessionCookie(res));
            const redisKey = userAndSessionRelationKey(sid);
            const sessionOwner = await testKit.sessionsRedisClient.get(redisKey);
            expect(sessionOwner).toBe(res.body.data.signUp.id);
        });
    });

    describe('Successful sign up', () => {
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

    describe('Email already exists', () => {
        test(`should return CONFLICT code and "${USER_MESSAGES.ALREADY_EXISTS}" message`, async () => {
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
        test(`should return BAD REQUEST code and "${COMMON_MESSAGES.INVALID_INPUT}" message`, async () => {
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

    describe('Password queried in graphql operation', () => {
        test('user password can not be queried from the response data', async () => {
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
        test(`should return CONFLICT code and "${USER_MESSAGES.ALREADY_EXISTS}" message`, async () => {
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
                role: userDb?.role.toUpperCase(),
                id: userDb?.id,
            });
        });
    });

    describe('Successful sign up', () => {
        test(`default user role should be "${UserRole.USER}"`, async () => {
            const user = testKit.userSeed.signUpInput;
            const res = await testKit.gqlClient
                .send(signUp({ args: user, fields: ['id'] }))
                .expect(success);
            const userId = res.body.data.signUp.id;
            const userDB = await testKit.userRepos.findOneByOrFail({ id: userId });
            expect(userDB.role).toBe(UserRole.USER);
        });
    });

    describe('Successful sign up', () => {
        test(`default account status should be "${AccountStatus.PENDING_VERIFICATION}"`, async () => {
            const user = testKit.userSeed.signUpInput;
            const res = await testKit.gqlClient
                .send(signUp({ args: user, fields: ['id'] }))
                .expect(success);
            const userId = res.body.data.signUp.id;
            const userDB = await testKit.userRepos.findOneByOrFail({ id: userId });
            expect(userDB.status).toBe(AccountStatus.PENDING_VERIFICATION);
        });
    });

    describe('Successful sign up', () => {
        test('user username should be stored as-is in database', async () => {
            const user = testKit.userSeed.signUpInput;
            const res = await testKit.gqlClient
                .send(signUp({ args: user, fields: ['id'] }))
                .expect(success);
            const userId = res.body.data.signUp.id;
            const userDB = await testKit.userRepos.findOneByOrFail({ id: userId });
            expect(userDB.username).toBe(user.username);
        });
    });

    describe('Successful sign up', () => {
        test('default reputation score should be 0', async () => {
            const user = testKit.userSeed.signUpInput;
            const res = await testKit.gqlClient
                .send(signUp({ args: user, fields: ['id'] }))
                .expect(success);
            const userId = res.body.data.signUp.id;
            const userDB = await testKit.userRepos.findOneByOrFail({ id: userId });
            expect(userDB.reputationScore).toBe(0);
        });
    });

    describe('Succesful sign up', () => {
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
    });

    describe('Successful sign up', () => {
        test('user email should be stored as-is in database', async () => {
            const user = testKit.userSeed.signUpInput;
            const res = await testKit.gqlClient
                .send(signUp({ args: user, fields: ['id'] }))
                .expect(success);
            const userId = res.body.data.signUp.id;
            const userDB = await testKit.userRepos.findOneByOrFail({ id: userId });
            expect(userDB.email).toBe(user.email);
        });
    });

    describe('Successful sign up', () => {
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

    describe(`More than ${THROTTLE_CONFIG.CRITICAL.limit} attemps in ${THROTTLE_CONFIG.CRITICAL.ttl / 1000}s from the same ip`, () => {
        test(`should return TOO MANY REQUESTS code and "${COMMON_MESSAGES.TOO_MANY_REQUESTS}" message`, async () => {
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
