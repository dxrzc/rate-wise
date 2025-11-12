import { signOutAll } from '@testing/tools/gql-operations/auth/sign-out-all.operation';
import { getSidFromCookie } from '@integration/utils/get-sid-from-cookie.util';
import { getSessionCookie } from '@integration/utils/get-session-cookie.util';
import { signIn } from '@testing/tools/gql-operations/auth/sign-in.operation';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';
import { createAccount } from '@integration/utils/create-account.util';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { AUTH_LIMITS } from 'src/auth/constants/auth.constants';
import { testKit } from '@integration/utils/test-kit.util';
import { Code } from 'src/common/enum/code.enum';
import { faker } from '@faker-js/faker/.';
import { THROTTLE_CONFIG } from 'src/common/constants/throttle.config.constants';
import { success } from '@integration/utils/no-errors.util';

describe('GraphQL - signOutAll', () => {
    describe('Session Cookie not provided', () => {
        test(`return "${Code.UNAUTHORIZED}" code and "${AUTH_MESSAGES.UNAUTHORIZED}" message`, async () => {
            const res = await testKit.gqlClient.send(
                signOutAll({ args: { password: 'password' } }),
            );
            expect(res).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.UNAUTHORIZED);
        });
    });

    describe('Successful', () => {
        test('delete all user sessions in redis', async () => {
            const { email, password, sessionCookie } = await createAccount();
            const sid1 = getSidFromCookie(sessionCookie);
            // sign in
            const signInRes = await testKit.gqlClient
                .send(signIn({ args: { email, password }, fields: ['id'] }))
                .expect(success);
            const sid2 = getSidFromCookie(getSessionCookie(signInRes));
            // check both sids exist in redis
            const session1 = testKit.sessionsRedisClient.get(`session:${sid1}`);
            const session2 = testKit.sessionsRedisClient.get(`session:${sid2}`);
            await expect(session1).resolves.not.toBeNull();
            await expect(session2).resolves.not.toBeNull();
            // sign out all
            await testKit.gqlClient
                .set('Cookie', sessionCookie)
                .send(signOutAll({ args: { password } }))
                .expect(success);
            // sids don't exist anymore
            await expect(testKit.sessionsRedisClient.get(`session:${sid1}`)).resolves.toBeNull();
            await expect(testKit.sessionsRedisClient.get(`session:${sid2}`)).resolves.toBeNull();
        });
    });

    describe('Password too long', () => {
        test('returns bad request code and invalid credentials message', async () => {
            const longPassword = faker.internet.password({
                length: AUTH_LIMITS.PASSWORD.MAX + 1,
            });
            const { sessionCookie } = await createAccount();
            const res = await testKit.gqlClient
                .set('Cookie', sessionCookie)
                .send(signOutAll({ args: { password: longPassword } }));
            expect(res).toFailWith(Code.BAD_REQUEST, AUTH_MESSAGES.INVALID_CREDENTIALS);
        });
    });

    describe('Password does not match', () => {
        test('returns bad request code and invalid credentials message', async () => {
            const { sessionCookie } = await createAccount();
            const res = await testKit.gqlClient
                .set('Cookie', sessionCookie)
                .send(signOutAll({ args: { password: 'password' } }));
            expect(res).toFailWith(Code.BAD_REQUEST, AUTH_MESSAGES.INVALID_CREDENTIALS);
        });
    });

    describe(`More than ${THROTTLE_CONFIG.ULTRA_CRITICAL.limit} attemps in ${THROTTLE_CONFIG.ULTRA_CRITICAL.ttl / 1000}s from the same ip`, () => {
        test('returns too many requests code and too many requests message', async () => {
            const ip = faker.internet.ip();
            const requests = Array.from({ length: THROTTLE_CONFIG.ULTRA_CRITICAL.limit }, () =>
                testKit.gqlClient
                    .set('X-Forwarded-For', ip)
                    .send(signOutAll({ args: { password: testKit.userSeed.password } })),
            );
            await Promise.all(requests);
            const res = await testKit.gqlClient.set('X-Forwarded-For', ip).send(
                signOutAll({
                    args: { password: testKit.userSeed.password },
                }),
            );
            expect(res).toFailWith(Code.TOO_MANY_REQUESTS, COMMON_MESSAGES.TOO_MANY_REQUESTS);
        });
    });
});
