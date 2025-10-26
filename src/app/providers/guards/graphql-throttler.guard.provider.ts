import { APP_GUARD } from '@nestjs/core';
import { GqlThrottlerGuard } from 'src/common/guards/graphql-throttler.guard';

export const gqlThrottlerGuard = {
    provide: APP_GUARD,
    useClass: GqlThrottlerGuard,
};
