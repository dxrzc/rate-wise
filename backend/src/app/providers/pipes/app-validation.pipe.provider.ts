import { AppValidationPipe } from 'src/common/pipes/app-validation.pipe';
import { APP_PIPE } from '@nestjs/core';

export const appValidationPipe = {
    provide: APP_PIPE,
    useClass: AppValidationPipe,
};
