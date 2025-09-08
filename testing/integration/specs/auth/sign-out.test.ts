import { getSidFromCookie } from '@integration/utils/get-sid-from-cookie.util';
import { signOut } from '@test-utils/operations/auth/sign-out.operation';
import { createUser } from '@integration/utils/create-user.util';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { testKit } from '@integration/utils/test-kit.util';
import { Code } from 'src/common/enum/code.enum';

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
                testKit.redisService.get(
                    `session:${getSidFromCookie(sessionCookie)}`,
                ),
            ).resolves.toBeNull();
        });
    });
});
