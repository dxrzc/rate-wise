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

describe('signOutAll', () => {
    describe('Successful signOutAll', () => {
        test("delete all the user's session cookies from redis ", async () => {
            // sign up
            const { email, password, sessionCookie } = await createAccount();
            const sid1 = getSidFromCookie(sessionCookie);

            // sign in
            const signInRes = await testKit.gqlClient.send(
                signIn({
                    input: { email, password },
                    fields: ['id'],
                }),
            );
            expect(signInRes).notToFail();
            const sid2 = getSidFromCookie(getSessionCookie(signInRes));

            // check both sids exist in redis
            await expect(
                testKit.sessionsRedisClient.get(`session:${sid1}`),
            ).resolves.not.toBeNull();
            await expect(
                testKit.sessionsRedisClient.get(`session:${sid2}`),
            ).resolves.not.toBeNull();

            // sign out all
            const res = await testKit.gqlClient.set('Cookie', sessionCookie).send(
                signOutAll({
                    input: { password },
                }),
            );
            expect(res).notToFail();

            // sids don't exist anymore
            await expect(testKit.sessionsRedisClient.get(`session:${sid1}`)).resolves.toBeNull();
            await expect(testKit.sessionsRedisClient.get(`session:${sid2}`)).resolves.toBeNull();
        });
    });

    describe('Session Cookie not provided', () => {
        test('return UNAUTHORIZED code and UNAUTHORIZED message', async () => {
            await expect(
                testKit.gqlClient.send(
                    signOutAll({
                        input: { password: 'password' },
                    }),
                ),
            ).resolves.toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.UNAUTHORIZED);
        });
    });

    describe('Password too short', () => {
        test('should return BAD REQUEST code and INVALID CREDENTIALS message', async () => {
            const shortPassword = faker.internet.password({
                length: AUTH_LIMITS.PASSWORD.MIN - 1,
            });
            const { sessionCookie } = await createAccount();
            const res = await testKit.gqlClient.set('Cookie', sessionCookie).send(
                signOutAll({
                    input: {
                        password: shortPassword,
                    },
                }),
            );
            expect(res).toFailWith(Code.BAD_REQUEST, AUTH_MESSAGES.INVALID_CREDENTIALS);
        });
    });

    describe('Password too long', () => {
        test('should return BAD REQUEST code and INVALID CREDENTIALS message', async () => {
            const longPassword = faker.internet.password({
                length: AUTH_LIMITS.PASSWORD.MAX + 1,
            });
            const { sessionCookie } = await createAccount();
            const res = await testKit.gqlClient.set('Cookie', sessionCookie).send(
                signOutAll({
                    input: {
                        password: longPassword,
                    },
                }),
            );
            expect(res).toFailWith(Code.BAD_REQUEST, AUTH_MESSAGES.INVALID_CREDENTIALS);
        });
    });

    describe('Password does not match', () => {
        test('should return BAD_REQUEST code and INVALID_CREDENTIALS message', async () => {
            const { sessionCookie } = await createAccount();
            await expect(
                testKit.gqlClient.set('Cookie', sessionCookie).send(
                    signOutAll({
                        input: { password: 'password' },
                    }),
                ),
            ).resolves.toFailWith(Code.BAD_REQUEST, AUTH_MESSAGES.INVALID_CREDENTIALS);
        });
    });

    describe(`More than ${THROTTLE_CONFIG.ULTRA_CRITICAL.limit} attemps in ${THROTTLE_CONFIG.ULTRA_CRITICAL.ttl / 1000}s from the same ip`, () => {
        test('should return TOO MANY REQUESTS code and message', async () => {
            const ip = faker.internet.ip();
            for (let i = 0; i < THROTTLE_CONFIG.ULTRA_CRITICAL.limit; i++) {
                await testKit.gqlClient.set('X-Forwarded-For', ip).send(
                    signOutAll({
                        input: { password: testKit.userSeed.password },
                    }),
                );
            }
            const res = await testKit.gqlClient.set('X-Forwarded-For', ip).send(
                signOutAll({
                    input: { password: testKit.userSeed.password },
                }),
            );
            expect(res).toFailWith(Code.TOO_MANY_REQUESTS, COMMON_MESSAGES.TOO_MANY_REQUESTS);
        });
    });
});
