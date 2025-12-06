import { createAccount } from '@integration/utils/create-account.util';
import { success } from '@integration/utils/no-errors.util';
import { testKit } from '@integration/utils/test-kit.util';
import { suspendAccount } from '@testing/tools/gql-operations/auth/suspend-account.operation';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { Code } from 'src/common/enum/code.enum';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { UserRole } from 'src/users/enums/user-role.enum';
import { USER_MESSAGES } from 'src/users/messages/user.messages';
import { THROTTLE_CONFIG } from 'src/common/constants/throttle.config.constants';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';
import { faker } from '@faker-js/faker';
import { findUserById } from '@testing/tools/gql-operations/users/find-by-id.operation';
import { createUserCacheKey } from 'src/users/cache/create-cache-key';

describe('GraphQL - suspendAccount', () => {
    describe('Session cookie not provided', () => {
        test('return unauthorized code and unauthorized error message', async () => {
            const response = await testKit.gqlClient.send(suspendAccount({ args: '123' }));
            expect(response).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.UNAUTHORIZED);
        });
    });

    describe('User role is reviewer and account status is active', () => {
        test('return forbidden code and forbidden error message', async () => {
            const { sessionCookie: reviewerSess } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.REVIEWER],
            });
            const response = await testKit.gqlClient
                .set('Cookie', reviewerSess)
                .send(suspendAccount({ args: '123' }));
            expect(response).toFailWith(Code.FORBIDDEN, AUTH_MESSAGES.FORBIDDEN);
        });
    });

    describe('User role is creator and account status is active', () => {
        test('return forbidden code and forbidden error message', async () => {
            const { sessionCookie: creatorSess } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.CREATOR],
            });
            const response = await testKit.gqlClient
                .set('Cookie', creatorSess)
                .send(suspendAccount({ args: '123' }));
            expect(response).toFailWith(Code.FORBIDDEN, AUTH_MESSAGES.FORBIDDEN);
        });
    });

    describe('User role is admin and account status is active', () => {
        test('return forbidden code and forbidden error message', async () => {
            const { sessionCookie: adminSess } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.ADMIN],
            });
            const response = await testKit.gqlClient
                .set('Cookie', adminSess)
                .send(suspendAccount({ args: '123' }));
            expect(response).toFailWith(Code.FORBIDDEN, AUTH_MESSAGES.FORBIDDEN);
        });
    });

    describe('Account status is pending verification', () => {
        test('return forbidden code and account is not active error message', async () => {
            const { sessionCookie } = await createAccount({
                status: AccountStatus.PENDING_VERIFICATION,
                roles: [UserRole.MODERATOR],
            });
            const { id: targetUserId } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.REVIEWER],
            });
            const response = await testKit.gqlClient
                .set('Cookie', sessionCookie)
                .send(suspendAccount({ args: targetUserId }));
            expect(response).toFailWith(Code.FORBIDDEN, AUTH_MESSAGES.ACCOUNT_IS_NOT_ACTIVE);
        });
    });

    describe('Account status is suspended', () => {
        test('return forbidden code and account is suspended error message', async () => {
            const { sessionCookie } = await createAccount({
                status: AccountStatus.SUSPENDED,
                roles: [UserRole.MODERATOR],
            });
            const { id: targetUserId } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.REVIEWER],
            });
            const response = await testKit.gqlClient
                .set('Cookie', sessionCookie)
                .send(suspendAccount({ args: targetUserId }));
            expect(response).toFailWith(Code.FORBIDDEN, AUTH_MESSAGES.ACCOUNT_IS_SUSPENDED);
        });
    });

    describe('User role is moderator and account status is active', () => {
        test('can suspend reviewers', async () => {
            const { sessionCookie: moderatorSess } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.MODERATOR],
            });
            const { id: reviewerId } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.REVIEWER],
            });
            await testKit.gqlClient
                .set('Cookie', moderatorSess)
                .send(suspendAccount({ args: reviewerId }))
                .expect(success);

            const userInDb = await testKit.userRepos.findOneByOrFail({ id: reviewerId });
            expect(userInDb.status).toBe(AccountStatus.SUSPENDED);
        });

        test('can suspend creators', async () => {
            const { sessionCookie: moderatorSess } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.MODERATOR],
            });
            const { id: creatorId } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.CREATOR],
            });
            await testKit.gqlClient
                .set('Cookie', moderatorSess)
                .send(suspendAccount({ args: creatorId }))
                .expect(success);

            const userInDb = await testKit.userRepos.findOneByOrFail({ id: creatorId });
            expect(userInDb.status).toBe(AccountStatus.SUSPENDED);
        });

        test('can not suspend admin (forbidden code and error)', async () => {
            const { sessionCookie: moderatorSess } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.MODERATOR],
            });
            const { id: adminId } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.ADMIN],
            });
            const response = await testKit.gqlClient
                .set('Cookie', moderatorSess)
                .send(suspendAccount({ args: adminId }));
            expect(response).toFailWith(Code.FORBIDDEN, AUTH_MESSAGES.FORBIDDEN);
        });

        test('can not suspend another moderator (forbidden code and error)', async () => {
            const { sessionCookie: moderatorSess } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.MODERATOR],
            });
            const { id: otherModeratorId } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.MODERATOR],
            });
            const response = await testKit.gqlClient
                .set('Cookie', moderatorSess)
                .send(suspendAccount({ args: otherModeratorId }));
            expect(response).toFailWith(Code.FORBIDDEN, AUTH_MESSAGES.FORBIDDEN);
        });

        test('user is deleted from redis cache', async () => {
            const { sessionCookie: moderatorSess } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.MODERATOR],
            });
            const { id: targetUserId } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.REVIEWER],
            });
            // trigger caching
            const cacheKey = createUserCacheKey(targetUserId);
            await testKit.gqlClient
                .send(findUserById({ fields: ['id'], args: targetUserId }))
                .expect(success);
            await expect(testKit.cacheManager.get(cacheKey)).resolves.toBeDefined();
            // suspend account
            await testKit.gqlClient
                .set('Cookie', moderatorSess)
                .send(suspendAccount({ args: targetUserId }))
                .expect(success);
            // user should have been removed from cache
            const userInCache = await testKit.cacheManager.get(cacheKey);
            expect(userInCache).toBeUndefined();
        });
    });

    describe('Target account is already suspended', () => {
        test('return conflict code and account already suspended error message', async () => {
            const { sessionCookie: moderatorSess } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.MODERATOR],
            });
            const { id: targetUserId } = await createAccount({
                status: AccountStatus.SUSPENDED,
                roles: [UserRole.REVIEWER],
            });
            const response = await testKit.gqlClient
                .set('Cookie', moderatorSess)
                .send(suspendAccount({ args: targetUserId }));
            expect(response).toFailWith(Code.CONFLICT, AUTH_MESSAGES.ACCOUNT_ALREADY_SUSPENDED);
        });
    });

    describe('Target account is not found', () => {
        test('return not found code and not found error message', async () => {
            const { sessionCookie: moderatorSess } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.MODERATOR],
            });
            const response = await testKit.gqlClient
                .set('Cookie', moderatorSess)
                .send(suspendAccount({ args: '550e8400-e29b-41d4-a716-446655440000' }));
            expect(response).toFailWith(Code.NOT_FOUND, USER_MESSAGES.NOT_FOUND);
        });
    });

    describe('More than allowed attempts from same ip', () => {
        test('return too many requests code and too many requests error message', async () => {
            const ip = faker.internet.ip();
            const { sessionCookie: moderatorSess } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.MODERATOR],
            });
            const { id: targetUserId } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.REVIEWER],
            });
            await Promise.all(
                Array.from({ length: THROTTLE_CONFIG.CRITICAL.limit }, () =>
                    testKit.gqlClient
                        .set('Cookie', moderatorSess)
                        .set('X-Forwarded-For', ip)
                        .send(suspendAccount({ args: targetUserId })),
                ),
            );
            const response = await testKit.gqlClient
                .set('Cookie', moderatorSess)
                .set('X-Forwarded-For', ip)
                .send(suspendAccount({ args: targetUserId }));
            expect(response).toFailWith(Code.TOO_MANY_REQUESTS, COMMON_MESSAGES.TOO_MANY_REQUESTS);
        });
    });
});
