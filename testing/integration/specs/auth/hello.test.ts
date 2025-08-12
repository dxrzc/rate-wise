import * as request from 'supertest';
import { signUpQuery } from '@queries/sign-up.query';
import { testKit } from '@integration/utils/test-kit.util';

describe('Lol', () => {
    test('create user', async () => {
        // TODO: convention, "input" object
        const userData = {
            email: 'rick_sanchez@gmail.com',
            username: 'Rick Sanchez',
            password: 'portalgun123',
        };
        const response = await request(testKit.app.getHttpServer())
            .post('/graphql')
            .send({ query: signUpQuery, variables: { userData } });
        console.log(response.body);
    });
});
