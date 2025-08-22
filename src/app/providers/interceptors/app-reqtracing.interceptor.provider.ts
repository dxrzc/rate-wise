import { APP_INTERCEPTOR } from '@nestjs/core';
import { RequestTracingInterceptor } from 'src/common/interceptors/request.interceptor';

export const appRequestTracingInterceptor = {
    provide: APP_INTERCEPTOR,
    useClass: RequestTracingInterceptor,
};
