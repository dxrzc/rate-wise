import { APP_GUARD } from '@nestjs/core';
import { CommonThrottlerGuard } from 'src/common/guards/common-throttler.guard';

export const gqlThrottlerGuard = {
    provide: APP_GUARD,
    useClass: CommonThrottlerGuard,
};
