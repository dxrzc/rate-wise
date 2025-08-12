/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import * as request from 'supertest';
import { signUpQuery } from '@queries/sign-up.query';
import { testKit } from '@integration/utils/test-kit.util';
import { createQuery } from '@integration/utils/create-query.util';

describe('signUp', () => {
    describe('User already exists', () => {
        test('return message "User alredy exists"', async () => {
            const user = {
                email: 'rick_sanchez@gmail.com',
                username: 'Rick Sanchez',
                password: 'portalgun123',
            };
            await request(testKit.app.getHttpServer())
                .post('/graphql')
                .send(createQuery(signUpQuery, user));
            // create sending the same user data
            const res = await request(testKit.app.getHttpServer())
                .post('/graphql')
                .send(createQuery(signUpQuery, user));

            expect(res.statusCode).toBe(200);
            expect(res.body).toHaveProperty('errors');
            expect(res.body.errors).toHaveLength(1);
            expect(res.body.errors[0].message).toContain('User already exists');
        });
    });
});
