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
    describe('Password too long', () => {
        test('throw BadRequestException and INVALID_INPUT error message', async () => {
            const data = {
                ...userDataGenerator.user,
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
                ...userDataGenerator.user,
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
                ...userDataGenerator.user,
                username: 'a'.repeat(AUTH_RULES.USERNAME.MAX + 1),
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });
});
