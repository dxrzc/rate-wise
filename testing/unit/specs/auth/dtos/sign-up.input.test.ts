import { validateAndTransform } from '@unit/utils/validateAndTransform.util';
import { UserSeedService } from 'src/seed/services/user-seed.service';
import { AUTH_LIMITS } from 'src/auth/constants/auth.constants';
import { SignUpInput } from 'src/auth/dtos/sign-up.input';
import { faker } from '@faker-js/faker/.';

const userSeed = new UserSeedService();

describe('SignUpInput', () => {
    describe('Username too long', () => {
        test('invalid input', async () => {
            const input = new SignUpInput();
            input.email = userSeed.email;
            input.password = userSeed.password;
            input.username = faker.string.alpha({
                length: AUTH_LIMITS.USERNAME.MAX + 1,
            });
            const { error } = await validateAndTransform(SignUpInput, input);
            expect(error).toContain('username');
        });
    });

    describe('Username too short', () => {
        test('invalid input', async () => {
            const input = new SignUpInput();
            input.email = userSeed.email;
            input.password = userSeed.password;
            input.username = faker.string.alpha({
                length: AUTH_LIMITS.USERNAME.MIN - 1,
            });
            const { error } = await validateAndTransform(SignUpInput, input);
            expect(error).toContain('username');
        });
    });

    describe('Invalid email format', () => {
        test('invalid input', async () => {
            const input = new SignUpInput();
            input.username = userSeed.username;
            input.password = userSeed.password;
            input.email = 'invalid_email_format';
            const { error } = await validateAndTransform(SignUpInput, input);
            expect(error).toContain('email');
        });
    });

    describe('Email too long', () => {
        test('invalid input', async () => {
            const input = new SignUpInput();
            input.username = userSeed.username;
            input.password = userSeed.password;
            input.email = faker.string.alpha({
                length: AUTH_LIMITS.EMAIL.MAX + 1,
            });
            const { error } = await validateAndTransform(SignUpInput, input);
            expect(error).toContain('email');
        });
    });

    describe('Email too short', () => {
        test('invalid input', async () => {
            const input = new SignUpInput();
            input.username = userSeed.username;
            input.password = userSeed.password;
            input.email = 'a@b.c';
            const { error } = await validateAndTransform(SignUpInput, input);
            expect(error).toContain('email');
        });
    });

    describe('Password too short', () => {
        test('invalid input', async () => {
            const input = new SignUpInput();
            input.username = userSeed.username;
            input.email = userSeed.email;
            input.password = faker.string.alpha({
                length: AUTH_LIMITS.PASSWORD.MIN - 1,
            });
            const { error } = await validateAndTransform(SignUpInput, input);
            expect(error).toContain('password');
        });
    });

    describe('Password too long', () => {
        test('invalid input', async () => {
            const input = new SignUpInput();
            input.username = userSeed.username;
            input.email = userSeed.email;
            input.password = faker.string.alpha({
                length: AUTH_LIMITS.PASSWORD.MAX + 1,
            });
            const { error } = await validateAndTransform(SignUpInput, input);
            expect(error).toContain('password');
        });
    });

    describe.each(['email', 'username', 'password'])(
        '%s not provided',
        (field) => {
            test('invalid input', async () => {
                const input = new SignUpInput();
                input.username = userSeed.username;
                input.email = userSeed.email;
                input.password = userSeed.password;
                delete input[field];
                const { error } = await validateAndTransform(
                    SignUpInput,
                    input,
                );
                expect(error).toContain(field);
            });
        },
    );

    describe('Valid input', () => {
        test('return input with no changes', async () => {
            const input = new SignUpInput();
            const username = userSeed.username;
            const email = userSeed.email;
            const password = userSeed.password;
            input.username = username;
            input.email = email;
            input.password = password;
            const { data } = await validateAndTransform(SignUpInput, input);
            expect(data?.username).toBe(username);
            expect(data?.email).toBe(email);
            expect(data?.password).toBe(password);
        });
    });
});
