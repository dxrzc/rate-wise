import { getSidFromCookie } from '@integration/utils/get-sid-from-cookie.util';
import { signOut } from '@commontestutils/operations/auth/sign-out.operation';
import { createUser } from '@integration/utils/create-user.util';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { testKit } from '@integration/utils/test-kit.util';
import { Code } from 'src/common/enum/code.enum';
import { THROTTLE_CONFIG } from 'src/common/constants/throttle.config.constants';
import { faker } from '@faker-js/faker/.';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';

describe('signOut', () => {
    describe('Session cookie not provided', () => {
        test('return UNAUTHORIZED code and UNAUTHORIZED message', async () => {
            const res = await testKit.request.send(signOut());
            expect(res).toFailWith(
                Code.UNAUTHORIZED,
                AUTH_MESSAGES.UNAUTHORIZED,
            );
        });
    });

    describe('Successful signOut', () => {
        test('session cookie should be removed from redis store', async () => {
            // sign up
            const { sessionCookie } = await createUser();
            // sign out
            const res = await testKit.request
                .set('Cookie', sessionCookie)
                .send(signOut());
            expect(res).notToFail();
            // cookie should be removed from redis
            await expect(
                testKit.sessionsRedisClient.get(
                    `session:${getSidFromCookie(sessionCookie)}`,
                ),
            ).resolves.toBeNull();
        });
    });

    describe(`More than ${THROTTLE_CONFIG.CRITICAL.limit} attemps in ${THROTTLE_CONFIG.CRITICAL.ttl / 1000}s from the same ip`, () => {
        test('should return TOO MANY REQUESTS code and message', async () => {
            const ip = faker.internet.ip();
            for (let i = 0; i < THROTTLE_CONFIG.CRITICAL.limit; i++) {
                await testKit.request
                    .set('X-Forwarded-For', ip)
                    .send(signOut());
            }
            const res = await testKit.request
                .set('X-Forwarded-For', ip)
                .send(signOut());
            expect(res).toFailWith(
                Code.TOO_MANY_REQUESTS,
                COMMON_MESSAGES.TOO_MANY_REQUESTS,
            );
        });
    });
});
