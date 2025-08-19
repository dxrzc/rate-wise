import { ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';

export const globalValidationPipe = {
    provide: APP_PIPE,
    useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
    }),
};
