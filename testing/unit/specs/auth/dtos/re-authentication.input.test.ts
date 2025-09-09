import { ReAuthenticationInput } from 'src/auth/dtos/re-authentication.input';
import { UserSeedService } from 'src/seed/services/user-seed.service';
import { validateAndTransform } from '@unit/utils/validateAndTransform.util';
import { AUTH_LIMITS } from 'src/auth/constants/auth.constants';
import { faker } from '@faker-js/faker/.';

const userSeed = new UserSeedService();

describe('ReAuthenticationInput', () => {
    describe('Password too long', () => {
        test('invalid input', async () => {
            const input = new ReAuthenticationInput();
            input.password = faker.internet.password({
                length: AUTH_LIMITS.PASSWORD.MAX + 1,
            });
            const { error } = await validateAndTransform(
                ReAuthenticationInput,
                input,
            );
            expect(error).toContain('password');
        });
    });

    describe('Password too short', () => {
        test('invalid input', async () => {
            const input = new ReAuthenticationInput();
            input.password = faker.internet.password({
                length: AUTH_LIMITS.PASSWORD.MIN - 1,
            });
            const { error } = await validateAndTransform(
                ReAuthenticationInput,
                input,
            );
            expect(error).toContain('password');
        });
    });

    describe('Valid input', () => {
        test('return input with no changes', async () => {
            const input = new ReAuthenticationInput();
            const password = userSeed.password;
            input.password = password;
            const { data } = await validateAndTransform(
                ReAuthenticationInput,
                input,
            );
            expect(data?.password).toBe(password);
        });
    });
});
