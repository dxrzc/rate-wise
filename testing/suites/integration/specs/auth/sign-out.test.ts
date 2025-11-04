import { getSidFromCookie } from '@integration/utils/get-sid-from-cookie.util';
import { signOut } from '@testing/tools/gql-operations/auth/sign-out.operation';
import { createAccount } from '@integration/utils/create-account.util';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { testKit } from '@integration/utils/test-kit.util';
import { Code } from 'src/common/enum/code.enum';
import { THROTTLE_CONFIG } from 'src/common/constants/throttle.config.constants';
import { faker } from '@faker-js/faker/.';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';
import { SESS_REDIS_PREFIX } from 'src/sessions/constants/sessions.constants';

describe('signOut', () => {
    describe('Session cookie not provided', () => {
                              test('return UNAUTHORIZED code and UNAUTHORIZED message', async () => {
            const res = await testKit.gqlClient.send(signOut());
            expect(res).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.UNAUTHORIZED);
        });
    });

    describe('Successful signOut', () => {
        test('session cookie should be removed from redis store', async () => {
            const { sessionCookie } = await createAccount();
            const res = await testKit.gqlClient.set('Cookie', sessionCookie).send(signOut());
            expect(res).notToFail();
            const sessInRedis = await testKit.sessionsRedisClient.get(
                `${SESS_REDIS_PREFIX}${getSidFromCookie(sessionCookie)}`,
            );
            expect(sessInRedis).toBeNull();
        });
    });

    describe(`More than ${THROTTLE_CONFIG.CRITICAL.limit} attemps in ${THROTTLE_CONFIG.CRITICAL.ttl / 1000}s from the same ip`, () => {
        test('should return TOO MANY REQUESTS code and message', async () => {
            const ip = faker.internet.ip();
            for (let i = 0; i < THROTTLE_CONFIG.CRITICAL.limit; i++) {
                await testKit.gqlClient.set('X-Forwarded-For', ip).send(signOut());
            }
            const res = await testKit.gqlClient.set('X-Forwarded-For', ip).send(signOut());
            expect(res).toFailWith(Code.TOO_MANY_REQUESTS, COMMON_MESSAGES.TOO_MANY_REQUESTS);
        });
    });
});
