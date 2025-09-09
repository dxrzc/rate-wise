import { COMMON_MESSAGES } from 'src/common/messages/common.messages';
import { HttpError } from 'src/common/errors/http.errors';
import { ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';

export const appValidationPipe = {
    provide: APP_PIPE,
    useValue: new ValidationPipe({
        whitelist: true,
        stopAtFirstError: true,
        forbidNonWhitelisted: true,
        exceptionFactory() {
            return HttpError.BadRequest(COMMON_MESSAGES.INVALID_INPUT);
        },
    }),
};
