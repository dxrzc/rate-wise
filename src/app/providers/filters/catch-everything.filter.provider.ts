import { APP_FILTER } from '@nestjs/core';
import { CatchEverythingFiler } from 'src/common/filters/catch-everything.filter';

export const catchEverythingFiler = {
    provide: APP_FILTER,
    useClass: CatchEverythingFiler,
};
