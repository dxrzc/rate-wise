import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';
import { AppValidationPipe } from 'src/common/pipes/app-validation.pipe';
import { UserSeedService } from 'src/seed/services/user-seed.service';
import { AUTH_LIMITS } from 'src/auth/constants/auth.constants';
import { SignInInput } from 'src/auth/dtos/sign-in.input';
import { mock } from 'jest-mock-extended';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';

const pipe = new AppValidationPipe(mock<HttpLoggerService>());
const userSeed = new UserSeedService();
const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: SignInInput,
};

describe('SignInInput', () => {
    describe('Valid email but too long', () => {
        test('throw BadRequestException and INVALID_INPUT message', async () => {
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
        test('throw BadRequestException and INVALID_INPUT message', async () => {
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
                password: 'a'.repeat(AUTH_LIMITS.PASSWORD.MAX + 1),
            };
            await expect(pipe.transform(data, metadata)).resolves.not.toThrow();
        });
    });

    describe('Password is too short', () => {
        test('do not throw', async () => {
            const data = {
                email: userSeed.email,
                password: 'a'.repeat(AUTH_LIMITS.PASSWORD.MIN - 1),
            };
            await expect(pipe.transform(data, metadata)).resolves.not.toThrow();
        });
    });
});
