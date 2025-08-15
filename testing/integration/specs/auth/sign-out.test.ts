/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { makeUserSessionRelationKey } from 'src/auth/functions/make-user-session-relation-key';
import { makeSessionsIndexKey } from 'src/auth/functions/make-sessions-index-key';
import { getSidFromCookie } from '@integration/utils/get-sid-from-cookie.util';
import { getSessionCookie } from '@integration/utils/get-session-cookie.util';
import { AUTHENTICATION_REQUIRED } from 'src/auth/constants/errors.constants';
import { createQuery } from '@integration/utils/create-query.util';
import { testKit } from '@integration/utils/test-kit.util';
import { signOutQuery } from '@queries/sign-out.query';
import { signUpQuery } from '@queries/sign-up.query';
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

    // Skipped since the deletions depends on the redis suscriber
    // but this process can not be awaited before the expect so the results can vary.
    describe.skip('Successful logout', () => {
        test('session id should be removed from the user sessions index', async () => {
            const signUpRes = await request(testKit.app.getHttpServer())
                .post('/graphql')
                .send(createQuery(signUpQuery, testKit.userSeed.signUpInput));
            expect(signUpRes).notToFail();
            const sessionCookie = getSessionCookie(signUpRes);
            const signOutRes = await request(testKit.app.getHttpServer())
                .post('/graphql')
                .send(createQuery(signOutQuery, {}))
                .set('Cookie', sessionCookie);
            expect(signOutRes).notToFail();
            const userSessions = await testKit.redisService.setMembers(
                makeSessionsIndexKey(signUpRes.body.data.signUp.id as string),
            );
            expect(userSessions.length).toBe(0);
        });

        test('user-session relation record should be deleted from redis db', async () => {
            const signUpRes = await request(testKit.app.getHttpServer())
                .post('/graphql')
                .send(createQuery(signUpQuery, testKit.userSeed.signUpInput));
            expect(signUpRes).notToFail();
            const sessionCookie = getSessionCookie(signUpRes);
            const signOutRes = await request(testKit.app.getHttpServer())
                .post('/graphql')
                .send(createQuery(signOutQuery, {}))
                .set('Cookie', sessionCookie);
            expect(signOutRes).notToFail();
            const key = makeUserSessionRelationKey(
                getSidFromCookie(sessionCookie),
            );
            const record = await testKit.redisService.get(key);
            expect(record).toBeNull();
        });
    });
});
