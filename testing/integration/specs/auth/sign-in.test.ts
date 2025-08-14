import { createQuery } from '@integration/utils/create-query.util';
import { createUser } from '@integration/utils/create-user.util';
import { testKit } from '@integration/utils/test-kit.util';
import { signInQuery } from '@queries/sign-in.query';
import { Code } from '@integration/enum/code.enum';
import * as request from 'supertest';
import {
    INVALID_CREDENTIALS,
    MAX_SESSIONS_REACHED,
} from 'src/auth/constants/errors.constants';
import { faker } from '@faker-js/faker/.';
import { PASSWORD_MAX_LENGTH } from 'src/auth/constants/auth.constants';

describe('signIn', () => {
    describe('Successful sign-in', () => {
        test('should set a session cookie', async () => {
            const { email, password } = await createUser();
            const res = await request(testKit.app.getHttpServer())
                .post('/graphql')
                .send(
                    createQuery(signInQuery, {
                        password,
                        email,
                    }),
                );
            expect(res).notToFail();
            expect(res).toContainCookie(testKit.sessConfig.cookieName);
        });
    });

    describe('Invalid password length (wiring test)', () => {
        test('should return BAD REQUEST and "Bad Request Exception" message', async () => {
            const invalidPassword = faker.internet.password({
                length: PASSWORD_MAX_LENGTH + 1,
            });
            const res = await request(testKit.app.getHttpServer())
                .post('/graphql')
                .send(
                    createQuery(signInQuery, {
                        password: invalidPassword,
                        email: testKit.userSeed.email,
                    }),
                );
            expect(res).toFailWith(Code.BAD_REQUEST, 'Bad Request Exception');
        });
    });

    describe('Password does not match', () => {
        test('should return BAD REQUEST and INVALID_CREDENTIALS message', async () => {
            const { email } = await createUser();
            const res = await request(testKit.app.getHttpServer())
                .post('/graphql')
                .send(
                    createQuery(signInQuery, {
                        password: testKit.userSeed.password,
                        email,
                    }),
                );
            expect(res).toFailWith(Code.BAD_REQUEST, INVALID_CREDENTIALS);
        });
    });

    describe('User in email does not exist', () => {
        test('should return BAD REQUEST and INVALID_CREDENTIALS message', async () => {
            const res = await request(testKit.app.getHttpServer())
                .post('/graphql')
                .send(
                    createQuery(signInQuery, {
                        password: testKit.userSeed.password,
                        email: testKit.userSeed.email,
                    }),
                );
            expect(res).toFailWith(Code.BAD_REQUEST, INVALID_CREDENTIALS);
        });
    });

    describe('User exceeds the maximum active sessions', () => {
        test('should return BAD REQUEST and MAX_SESSIONS_REACHED message', async () => {
            const maxSessions = testKit.sessConfig.maxUserSessions;
            const { email, password } = await createUser(); // 1 session
            for (let i = 0; i < maxSessions - 1; i++) {
                await expect(
                    request(testKit.app.getHttpServer()).post('/graphql').send(
                        createQuery(signInQuery, {
                            password,
                            email,
                        }),
                    ),
                ).resolves.notToFail();
            }
            const res = await request(testKit.app.getHttpServer())
                .post('/graphql')
                .send(
                    createQuery(signInQuery, {
                        password,
                        email,
                    }),
                );
            expect(res).toFailWith(Code.BAD_REQUEST, MAX_SESSIONS_REACHED);
        });
    });
});
