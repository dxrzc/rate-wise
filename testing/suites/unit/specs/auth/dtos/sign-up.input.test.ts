import { AppValidationPipe } from 'src/common/pipes/app-validation.pipe';
import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { UserSeedService } from 'src/seed/services/user-seed.service';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';
import { AUTH_LIMITS } from 'src/auth/constants/auth.constants';
import { SignUpInput } from 'src/auth/dtos/sign-up.input';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { mock } from 'jest-mock-extended';

const pipe = new AppValidationPipe(mock<HttpLoggerService>());
const userSeed = new UserSeedService();
const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: SignUpInput,
};

describe('SignUpInput', () => {
    describe('Password too long', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...userSeed.user,
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
                ...userSeed.user,
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
                ...userSeed.user,
                username: 'a'.repeat(AUTH_LIMITS.USERNAME.MAX + 1),
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });
});
