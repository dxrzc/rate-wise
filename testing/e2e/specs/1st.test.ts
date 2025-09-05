import { USER_MESSAGES } from 'src/users/messages/user.messages';
import { signUpQuery } from '@queries/sign-up.query';
import { e2eKit } from '../utils/e2e-kit.util';

describe('Test', () => {
    test('1st test', async () => {
        const res = await e2eKit.graphQLClient.request(signUpQuery, {
            email: 'anexo@gmail.com',
            password: 'anexito12345',
            username: 'Anextaran',
        });
        expect(res.error?.code).toBe(USER_MESSAGES.ALREADY_EXISTS);
    });
});
