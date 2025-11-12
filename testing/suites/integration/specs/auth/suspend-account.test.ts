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
import { createUserCacheKey } from 'src/users/cache/create-key';
import { findUserById } from '@testing/tools/gql-operations/users/find-by-id.operation';

describe('GraphQL - suspendAccount', () => {
    describe('Session cookie not provided', () => {
        test('return unauthorized code and unauthorized error message', async () => {
            const response = await testKit.gqlClient.send(suspendAccount({ args: '123' }));
            expect(response).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.UNAUTHORIZED);
        });
    });

    describe('Account successfuly suspended', () => {
        test('account status is updated to suspended', async () => {
            const { sessionCookie: adminSess } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.USER, UserRole.ADMIN],
            });
            const { id: targetUserId } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.USER],
            });
            // suspend account
            await testKit.gqlClient
                .set('Cookie', adminSess)
                .send(suspendAccount({ args: targetUserId }))
                .expect(success);
            const userInDb = await testKit.userRepos.findOneByOrFail({ id: targetUserId });
            expect(userInDb.status).toBe(AccountStatus.SUSPENDED);
        });

        test('User is deleted from redis cache', async () => {
            // suspend an account
            const { sessionCookie: adminSess } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.USER, UserRole.ADMIN],
            });
            const { id: targetUserId } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.USER],
            });
            // trigger caching
            const cacheKey = createUserCacheKey(targetUserId);
            await testKit.gqlClient
                .send(findUserById({ fields: ['id'], args: targetUserId }))
                .expect(success);
            await expect(testKit.cacheManager.get(cacheKey)).resolves.toBeDefined();
            // suspend account
            await testKit.gqlClient
                .set('Cookie', adminSess)
                .send(suspendAccount({ args: targetUserId }))
                .expect(success);
            // user should have been removed from cache
            const userInCache = await testKit.cacheManager.get(cacheKey);
            expect(userInCache).toBeUndefined();
        });
    });

    describe('User roles are not ADMIN or MODERATOR', () => {
        test('return forbidden code and forbidden error message', async () => {
            const { sessionCookie: userSess } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.USER],
            });
            const response = await testKit.gqlClient
                .set('Cookie', userSess)
                .send(suspendAccount({ args: '123' }));
            expect(response).toFailWith(Code.FORBIDDEN, AUTH_MESSAGES.FORBIDDEN);
        });
    });

    describe('ADMIN role attemp to suspend another ADMIN', () => {
        test('return forbidden code and forbidden error message', async () => {
            const { sessionCookie: adminSess } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN],
            });
            const { id: targetUserId } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN],
            });
            const response = await testKit.gqlClient
                .set('Cookie', adminSess)
                .send(suspendAccount({ args: targetUserId }));
            expect(response).toFailWith(Code.FORBIDDEN, AUTH_MESSAGES.FORBIDDEN);
        });
    });

    describe('MODERATOR role attemp to suspend an ADMIN', () => {
        test('return forbidden code and forbidden error message', async () => {
            const { sessionCookie: moderatorSess } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.USER, UserRole.MODERATOR],
            });
            const { id: targetUserId } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN],
            });
            const response = await testKit.gqlClient
                .set('Cookie', moderatorSess)
                .send(suspendAccount({ args: targetUserId }));
            expect(response).toFailWith(Code.FORBIDDEN, AUTH_MESSAGES.FORBIDDEN);
        });
    });

    test('ADMIN roles can suspend MODERATORs', async () => {
        const { sessionCookie: adminSess } = await createAccount({
            status: AccountStatus.ACTIVE,
            roles: [UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN],
        });
        const { id: moderatorId } = await createAccount({
            roles: [UserRole.USER, UserRole.MODERATOR],
            status: AccountStatus.ACTIVE,
        });
        await testKit.gqlClient
            .set('Cookie', adminSess)
            .send(suspendAccount({ args: moderatorId }))
            .expect(success);
    });

    test('MODERATOR roles can suspend USERs', async () => {
        const { sessionCookie: moderatorSess } = await createAccount({
            status: AccountStatus.ACTIVE,
            roles: [UserRole.USER, UserRole.MODERATOR],
        });
        const { id: userId } = await createAccount({
            status: AccountStatus.ACTIVE,
            roles: [UserRole.USER],
        });
        await testKit.gqlClient
            .set('Cookie', moderatorSess)
            .send(suspendAccount({ args: userId }))
            .expect(success);
    });

    describe('Target account is already suspended', () => {
        test('return conflict code and account already suspended error message', async () => {
            const { sessionCookie: adminSess } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN],
            });
            const { id: targetUserId } = await createAccount({
                status: AccountStatus.SUSPENDED,
                roles: [UserRole.USER],
            });
            const response = await testKit.gqlClient
                .set('Cookie', adminSess)
                .send(suspendAccount({ args: targetUserId }));
            expect(response).toFailWith(Code.CONFLICT, AUTH_MESSAGES.ACCOUNT_ALREADY_SUSPENDED);
        });
    });

    describe('Target account is not found', () => {
        test('return not found code and not found error message', async () => {
            const { sessionCookie: adminSess } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.USER, UserRole.MODERATOR, UserRole.ADMIN],
            });
            const response = await testKit.gqlClient
                .set('Cookie', adminSess)
                .send(suspendAccount({ args: '550e8400-e29b-41d4-a716-446655440000' }));
            expect(response).toFailWith(Code.NOT_FOUND, USER_MESSAGES.NOT_FOUND);
        });
    });

    describe('Account status is pending verification', () => {
        test('return forbidden code and account is not active error message', async () => {
            const { sessionCookie } = await createAccount({
                status: AccountStatus.PENDING_VERIFICATION,
                roles: [UserRole.USER, UserRole.ADMIN],
            });
            const { id: targetUserId } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.USER],
            });
            const response = await testKit.gqlClient
                .set('Cookie', sessionCookie)
                .send(suspendAccount({ args: targetUserId }));
            expect(response).toFailWith(Code.FORBIDDEN, AUTH_MESSAGES.ACCOUNT_IS_NOT_ACTIVE);
        });
    });

    describe('More than allowed attempts from same ip', () => {
        test('return too many requests code and too many requests error message', async () => {
            const ip = faker.internet.ip();
            const { sessionCookie: adminSess } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.USER, UserRole.ADMIN],
            });
            const { id: targetUserId } = await createAccount({
                status: AccountStatus.ACTIVE,
                roles: [UserRole.USER],
            });
            await Promise.all(
                Array.from({ length: THROTTLE_CONFIG.CRITICAL.limit }, () =>
                    testKit.gqlClient
                        .set('Cookie', adminSess)
                        .set('X-Forwarded-For', ip)
                        .send(suspendAccount({ args: targetUserId })),
                ),
            );
            const response = await testKit.gqlClient
                .set('Cookie', adminSess)
                .set('X-Forwarded-For', ip)
                .send(suspendAccount({ args: targetUserId }));
            expect(response).toFailWith(Code.TOO_MANY_REQUESTS, COMMON_MESSAGES.TOO_MANY_REQUESTS);
        });
    });
});
