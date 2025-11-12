import { faker } from '@faker-js/faker/.';
import { createAccount } from '@integration/utils/create-account.util';
import { getSidFromCookie } from '@integration/utils/get-sid-from-cookie.util';
import { success } from '@integration/utils/no-errors.util';
import { testKit } from '@integration/utils/test-kit.util';
import { signOut } from '@testing/tools/gql-operations/auth/sign-out.operation';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { THROTTLE_CONFIG } from 'src/common/constants/throttle.config.constants';
import { Code } from 'src/common/enum/code.enum';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';
import { SESS_REDIS_PREFIX } from 'src/sessions/constants/sessions.constants';

describe('GraphQL - signOut', () => {
    describe('Session cookie not provided', () => {
        test(`return UNAUTHORIZED code and ${AUTH_MESSAGES.UNAUTHORIZED} message`, async () => {
            const res = await testKit.gqlClient.send(signOut());
            expect(res).toFailWith(Code.UNAUTHORIZED, AUTH_MESSAGES.UNAUTHORIZED);
        });
    });

    describe('Successful signOut', () => {
        test('session cookie should be removed from Redis store', async () => {
            const { sessionCookie } = await createAccount();
            await testKit.gqlClient.set('Cookie', sessionCookie).send(signOut()).expect(success);
            const redisKey = `${SESS_REDIS_PREFIX}${getSidFromCookie(sessionCookie)}`;
            const sessInRedis = await testKit.sessionsRedisClient.get(redisKey);
            expect(sessInRedis).toBeNull();
        });
    });

    describe(`More than ${THROTTLE_CONFIG.CRITICAL.limit} attemps in ${THROTTLE_CONFIG.CRITICAL.ttl / 1000}s from the same ip`, () => {
        test('returns too many requests code and too many requests message', async () => {
            const ip = faker.internet.ip();
            await Promise.all(
                Array.from({ length: THROTTLE_CONFIG.CRITICAL.limit }, () =>
                    testKit.gqlClient.set('X-Forwarded-For', ip).send(signOut()),
                ),
            );
            const res = await testKit.gqlClient.set('X-Forwarded-For', ip).send(signOut());
            expect(res).toFailWith(Code.TOO_MANY_REQUESTS, COMMON_MESSAGES.TOO_MANY_REQUESTS);
        });
    });
});
