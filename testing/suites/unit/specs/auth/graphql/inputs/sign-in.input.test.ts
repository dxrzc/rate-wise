import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';
import { AppValidationPipe } from 'src/common/pipes/app-validation.pipe';
import { mock } from 'jest-mock-extended';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { SignInInput } from 'src/auth/graphql/inputs/sign-in.input';
import { UserDataGenerator } from 'src/seed/generators/user-data.generator';
import { AUTH_RULES } from 'src/auth/policy/auth.rules';

const pipe = new AppValidationPipe(mock<HttpLoggerService>());
const userSeed = new UserDataGenerator();
const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: SignInInput,
};

describe('SignInInput', () => {
    describe('Valid email but too long', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                email: 'a'.repeat(255) + '@example.com',
                password: userSeed.password,
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Invalid email format', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                email: 'invalid-email-format',
                password: userSeed.password,
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });

    describe('Password too long', () => {
        test('do not throw', async () => {
            const data = {
                email: userSeed.email,
                password: 'a'.repeat(AUTH_RULES.PASSWORD.MAX + 1),
            };
            await expect(pipe.transform(data, metadata)).resolves.not.toThrow();
        });
    });

    describe('Password is too short', () => {
        test('do not throw', async () => {
            const data = {
                email: userSeed.email,
                password: 'a'.repeat(AUTH_RULES.PASSWORD.MIN - 1),
            };
            await expect(pipe.transform(data, metadata)).resolves.not.toThrow();
        });
    });
});
