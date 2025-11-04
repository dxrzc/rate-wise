import { APP_GUARD } from '@nestjs/core';
import { RateLimiterGuard } from 'src/common/guards/rate-limiter.guard';

export const rateLimiterGuard = {
    provide: APP_GUARD,
    useClass: RateLimiterGuard,
};
