import { ReAuthenticationInput } from 'src/auth/dtos/re-authentication.input';
import { AppValidationPipe } from 'src/common/pipes/app-validation.pipe';
import { HttpLoggerService } from 'src/logging/http/http-logger.service';
import { ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';
import { AUTH_LIMITS } from 'src/auth/constants/auth.constants';
import { faker } from '@faker-js/faker/.';
import { mock } from 'jest-mock-extended';

const pipe = new AppValidationPipe(mock<HttpLoggerService>());
const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: ReAuthenticationInput,
};

describe('ReAuthenticationInput', () => {
    describe('Password too long', () => {
        test('throw BadRequestException and INVALID_INPUT messgae', async () => {
            const data = {
                password: faker.internet.password({
                    length: AUTH_LIMITS.PASSWORD.MAX + 1,
                }),
            };
            await expect(pipe.transform(data, metadata)).rejects.toThrow(
                new BadRequestException(COMMON_MESSAGES.INVALID_INPUT),
            );
        });
    });
});
