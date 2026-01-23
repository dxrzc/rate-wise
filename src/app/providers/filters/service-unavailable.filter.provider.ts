import { APP_FILTER } from '@nestjs/core';
import { ServiceUnavailableErrorFilter } from 'src/common/filters/service-unavailable.filter';

export const serviceUnavailableErrorFilter = {
    provide: APP_FILTER,
    useClass: ServiceUnavailableErrorFilter,
};
