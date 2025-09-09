import { signOutAll } from '@test-utils/operations/auth/sign-out-all.operation';
import { getSidFromCookie } from '@integration/utils/get-sid-from-cookie.util';
import { getSessionCookie } from '@integration/utils/get-session-cookie.util';
import { PASSWORD_MAX_LENGTH } from 'src/auth/constants/auth.constants';
import { signIn } from '@test-utils/operations/auth/sign-in.operation';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';
import { createUser } from '@integration/utils/create-user.util';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { testKit } from '@integration/utils/test-kit.util';
import { Code } from 'src/common/enum/code.enum';
import { faker } from '@faker-js/faker/.';

describe('signOutAll', () => {
    describe('Successful signOutAll', () => {
        test("delete all the user's session cookies from redis ", async () => {
            // sign up
            const { email, password, sessionCookie } = await createUser();
            const sid1 = getSidFromCookie(sessionCookie);

            // sign in
            const signInRes = await testKit.request.send(
                signIn({
                    input: { email, password },
                    fields: ['id'],
                }),
            );
            expect(signInRes).notToFail();
            const sid2 = getSidFromCookie(getSessionCookie(signInRes));

            // check both sids exist in redis
            await expect(
                testKit.redisService.get(`session:${sid1}`),
            ).resolves.not.toBeNull();
            await expect(
                testKit.redisService.get(`session:${sid2}`),
            ).resolves.not.toBeNull();

            // sign out all
            const res = await testKit.request.set('Cookie', sessionCookie).send(
                signOutAll({
                    input: { password },
                }),
            );
            expect(res).notToFail();

            // sids don't exist anymore
            await expect(
                testKit.redisService.get(`session:${sid1}`),
            ).resolves.toBeNull();
            await expect(
                testKit.redisService.get(`session:${sid2}`),
            ).resolves.toBeNull();
        });
    });

    describe('Session Cookie not provided', () => {
        test('return UNAUTHORIZED code and UNAUTHORIZED message', async () => {
            await expect(
                testKit.request.send(
                    signOutAll({
                        input: { password: 'password' },
                    }),
                ),
            ).resolves.toFailWith(
                Code.UNAUTHORIZED,
                AUTH_MESSAGES.UNAUTHORIZED,
            );
        });
    });

    describe('Invalid password length (wiring test)', () => {
        test('should return BAD REQUEST code and INVALID_INPUT message', async () => {
            const { sessionCookie } = await createUser();
            const res = await testKit.request.set('Cookie', sessionCookie).send(
                signOutAll({
                    input: {
                        password: faker.internet.password({
                            length: PASSWORD_MAX_LENGTH + 1,
                        }),
                    },
                }),
            );
            expect(res).toFailWith(
                Code.BAD_REQUEST,
                COMMON_MESSAGES.INVALID_INPUT,
            );
        });
    });

    describe('Password does not match', () => {
        test('should return BAD_REQUEST code and INVALID_CREDENTIALS message', async () => {
            const { sessionCookie } = await createUser();
            await expect(
                testKit.request.set('Cookie', sessionCookie).send(
                    signOutAll({
                        input: { password: 'password' },
                    }),
                ),
            ).resolves.toFailWith(
                Code.BAD_REQUEST,
                AUTH_MESSAGES.INVALID_CREDENTIALS,
            );
        });
    });
});
