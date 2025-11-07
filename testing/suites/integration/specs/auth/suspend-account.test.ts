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

describe('GraphQL - suspendAccount', () => {
    describe('Session cookie not provided', () => {
        test(`return UNAUTHORIZED code and ${AUTH_MESSAGES.UNAUTHORIZED} message`, async () => {
            const response = await testKit.gqlClient.send(suspendAccount({ args: '123' }));
            expect(response).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.UNAUTHORIZED);
        });
    });

    describe('User roles are not ADMIN or MODERATOR', () => {
        test(`should return "${Code.FORBIDDEN}" code and "${AUTH_MESSAGES.FORBIDDEN}" message`, async () => {
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
        test(`should return "${Code.FORBIDDEN}" code and "${AUTH_MESSAGES.FORBIDDEN}" message`, async () => {
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
        test(`should return "${Code.FORBIDDEN}" code and "${AUTH_MESSAGES.FORBIDDEN}" message`, async () => {
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
        test(`should return "${Code.CONFLICT}" code and "${AUTH_MESSAGES.ACCOUNT_ALREADY_SUSPENDED}" message`, async () => {
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
        test(`should return "${Code.NOT_FOUND}" code and "${USER_MESSAGES.NOT_FOUND}" message`, async () => {
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

    describe(`Account status is "${AccountStatus.PENDING_VERIFICATION}"`, () => {
        test(`should return "${Code.FORBIDDEN}" code and "${AUTH_MESSAGES.ACCOUNT_IS_NOT_ACTIVE}" message`, async () => {
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

    describe(`More than ${THROTTLE_CONFIG.CRITICAL.limit} attempts in ${THROTTLE_CONFIG.CRITICAL.ttl / 1000}s from the same ip`, () => {
        test(`should return "${Code.TOO_MANY_REQUESTS}" code and "${COMMON_MESSAGES.TOO_MANY_REQUESTS}" message`, async () => {
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
