import { AppValidationPipe } from 'src/common/pipes/app-validation.pipe';
import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';
import { SignUpInput } from 'src/auth/graphql/inputs/sign-up.input';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { mock } from 'jest-mock-extended';
import { UserDataGenerator } from 'src/seed/generators/user-data.generator';
import { AUTH_RULES } from 'src/auth/policy/auth.rules';

const pipe = new AppValidationPipe(mock<HttpLoggerService>());
const userDataGenerator = new UserDataGenerator();
const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: SignUpInput,
};

describe('SignUpInput', () => {
    test('should validate valid sign-up input', async () => {
        const data = userDataGenerator.signUpInput;
        const result = await pipe.transform(data, metadata);
        expect(result).toEqual(data);
    });

    describe('Password too long', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...userDataGenerator.signUpInput,
                password: 'a'.repeat(129),
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Invalid email format', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...userDataGenerator.signUpInput,
                email: 'invalid-email',
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Username too long', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...userDataGenerator.signUpInput,
                username: 'a'.repeat(AUTH_RULES.USERNAME.MAX + 1),
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Username is not full lowercase', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...userDataGenerator.signUpInput,
                username: `ABC${userDataGenerator.username}XYZ`,
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Email field transform', () => {
        test('trim whitespace from email', async () => {
            const data = {
                ...userDataGenerator.signUpInput,
                email: '  test@example.com  ',
            };
            const result = await pipe.transform(data, metadata);
            expect(result.email).toBe('test@example.com');
        });

        test('convert email to lowercase', async () => {
            const data = {
                ...userDataGenerator.signUpInput,
                email: 'TEST@EXAMPLE.COM',
            };
            const result = await pipe.transform(data, metadata);
            expect(result.email).toBe('test@example.com');
        });

        test('trim and lowercase together', async () => {
            const data = {
                ...userDataGenerator.signUpInput,
                email: '  TEST@EXAMPLE.COM  ',
            };
            const result = await pipe.transform(data, metadata);
            expect(result.email).toBe('test@example.com');
        });
    });
});
