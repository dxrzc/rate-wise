import * as request from 'supertest';
import { Code } from '@integration/enum/code.enum';
import { signUpQuery } from '@queries/sign-up.query';
import { testKit } from '@integration/utils/test-kit.util';
import { createQuery } from '@integration/utils/create-query.util';

describe('signUp', () => {
    describe('Username already exists', () => {
        test('return BAD REQUEST', async () => {
            const username = testKit.userSeed.username;
            await request(testKit.app.getHttpServer())
                .post('/graphql')
                .send(
                    createQuery(signUpQuery, {
                        username,
                        email: testKit.userSeed.email,
                        password: testKit.userSeed.password,
                    }),
                );
            // create another user with the same username
            const res = await request(testKit.app.getHttpServer())
                .post('/graphql')
                .send(
                    createQuery(signUpQuery, {
                        username,
                        email: testKit.userSeed.email,
                        password: testKit.userSeed.password,
                    }),
                );
            // TODO: abstract error messages
            expect(res).toFailWith(Code.BAD_REQUEST, 'My nepe already exists');
        });
    });
});
