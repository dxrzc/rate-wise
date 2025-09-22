import { signOut } from '@utils/operations/auth/sign-out.operation';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { createUser } from '@integration/utils/create-user.util';
import { USER_MESSAGES } from 'src/users/messages/user.messages';
import { testKit } from '@integration/utils/test-kit.util';
import { Code } from 'src/common/enum/code.enum';

// Any protected route that uses this middleware
const protectedRoute = signOut();

describe('AuthGuard', () => {
    describe('Session cookie not provided', () => {
        test('should return UNAUTHORIZED code and UNAUTHORIZED message', async () => {
            const res = await testKit.request.send(protectedRoute);
            expect(res).toFailWith(
                Code.UNAUTHORIZED,
                AUTH_MESSAGES.UNAUTHORIZED,
            );
        });
    });

    describe('User in cookie not found', () => {
        test('should return NOT_FOUND and USER_NOT_FOUND message', async () => {
            const { sessionCookie, id } = await createUser();
            await testKit.userRepos.delete({ id });
            const res = await testKit.request
                .set('Cookie', sessionCookie)
                .send(signOut());
            expect(res).toFailWith(Code.NOT_FOUND, USER_MESSAGES.NOT_FOUND);
        });
    });
});
