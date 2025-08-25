import { getSidFromCookie } from '@integration/utils/get-sid-from-cookie.util';
import { createQuery } from '@integration/utils/create-query.util';
import { createUser } from '@integration/utils/create-user.util';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { testKit } from '@integration/utils/test-kit.util';
import { signOutQuery } from '@queries/sign-out.query';
import { Code } from '@integration/enum/code.enum';
import * as request from 'supertest';

describe('signOut', () => {
    describe('Session cookie not provided', () => {
        test('return UNAUTHORIZED code and UNAUTHORIZED message', async () => {
            const res = await request(testKit.app.getHttpServer())
                .post('/graphql')
                .send(createQuery(signOutQuery, {}));
            expect(res).toFailWith(
                Code.UNAUTHENTICATED,
                AUTH_MESSAGES.UNAUTHORIZED,
            );
        });
    });

    describe('Successful signOut', () => {
        test('session cookie should be removed from redis store', async () => {
            // sign up
            const { sessionCookie } = await createUser();
            // sign out
            const res = await request(testKit.app.getHttpServer())
                .post('/graphql')
                .set('Cookie', sessionCookie)
                .send(createQuery(signOutQuery, {}));
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
