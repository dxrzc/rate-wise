import { AUTHENTICATION_REQUIRED } from 'src/auth/constants/errors.constants';
import { createQuery } from '@integration/utils/create-query.util';
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
});
