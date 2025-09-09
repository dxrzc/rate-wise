import { validateAndTransform } from '@unit/utils/validateAndTransform.util';
import { UserSeedService } from 'src/seed/services/user-seed.service';
import { AUTH_LIMITS } from 'src/auth/constants/auth.constants';
import { SignInInput } from 'src/auth/dtos/sign-in.input';
import { faker } from '@faker-js/faker/.';

const userSeed = new UserSeedService();

describe('SignInInput', () => {
    describe('Email too long', () => {
        test('invalid input', async () => {
            const input = new SignInInput();
            input.password = userSeed.password;
            input.email = faker.string.alpha({
                length: AUTH_LIMITS.EMAIL.MAX + 1,
            });
            const { error } = await validateAndTransform(SignInInput, input);
            expect(error).toContain('email');
        });
    });

    describe('Email too short', () => {
        test('invalid input', async () => {
            const input = new SignInInput();
            input.password = userSeed.password;
            input.email = 'a@b.c';
            const { error } = await validateAndTransform(SignInInput, input);
            expect(error).toContain('email');
        });
    });

    describe('Email not provided', () => {
        test('invalid input', async () => {
            const input = new SignInInput();
            input.password = userSeed.password;
            const { error } = await validateAndTransform(SignInInput, input);
            expect(error).toContain('email');
        });
    });

    describe('Invalid email format', () => {
        test('invalid input', async () => {
            const input = new SignInInput();
            input.password = userSeed.password;
            input.email = 'invalid_email_format';
            const { error } = await validateAndTransform(SignInInput, input);
            expect(error).toContain('email');
        });
    });

    describe('Password not provided', () => {
        test('invalid input', async () => {
            const input = new SignInInput();
            input.email = userSeed.email;
            const { error } = await validateAndTransform(SignInInput, input);
            expect(error).toContain('password');
        });
    });

    describe('Password too short', () => {
        test('validation passes', async () => {
            const input = new SignInInput();
            input.email = userSeed.email;
            input.password = faker.string.alpha({
                length: AUTH_LIMITS.PASSWORD.MIN - 1,
            });
            const { error } = await validateAndTransform(SignInInput, input);
            expect(error).toBeUndefined();
        });
    });

    describe('Password too long', () => {
        test('invalid input', async () => {
            const input = new SignInInput();
            input.email = userSeed.email;
            input.password = faker.string.alpha({
                length: AUTH_LIMITS.PASSWORD.MAX + 1,
            });
            const { error } = await validateAndTransform(SignInInput, input);
            expect(error).toContain('password');
        });
    });

    describe.each(['email', 'password'])('%s not provided', (field) => {
        test('invalid input', async () => {
            const input = new SignInInput();
            input.email = userSeed.email;
            input.password = userSeed.password;
            delete input[field];
            const { error } = await validateAndTransform(SignInInput, input);
            expect(error).toContain(field);
        });
    });

    describe('Valid input', () => {
        test('return input with no changes', async () => {
            const input = new SignInInput();
            const email = userSeed.email;
            const password = userSeed.password;
            input.email = email;
            input.password = password;
            const { data } = await validateAndTransform(SignInInput, input);
            expect(data?.email).toBe(email);
            expect(data?.password).toBe(password);
        });
    });
});
