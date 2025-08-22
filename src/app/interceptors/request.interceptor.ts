import { APP_INTERCEPTOR } from '@nestjs/core';
import { RequestInterceptor } from 'src/common/interceptors/request.interceptor';

export const globalRequestInterceptor = {
    provide: APP_INTERCEPTOR,
    useClass: RequestInterceptor,
};
