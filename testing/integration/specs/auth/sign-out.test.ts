import { AUTHENTICATION_REQUIRED } from 'src/auth/constants/errors.constants';
import { getSidFromCookie } from '@integration/utils/get-sid-from-cookie.util';
import { createQuery } from '@integration/utils/create-query.util';
import { createUser } from '@integration/utils/create-user.util';
import { testKit } from '@integration/utils/test-kit.util';
import { signOutQuery } from '@queries/sign-out.query';
import { Code } from '@integration/enum/code.enum';
import * as request from 'supertest';

describe('signOut', () => {
    describe('Session cookie not provided', () => {
        test('return UNAUTHORIZED and AUTHENTICATION_REQUIRED message', async () => {
            const res = await request(testKit.app.getHttpServer())
                .post('/graphql')
                .send(createQuery(signOutQuery, {}));
            expect(res).toFailWith(
                Code.UNAUTHENTICATED,
                AUTHENTICATION_REQUIRED,
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
