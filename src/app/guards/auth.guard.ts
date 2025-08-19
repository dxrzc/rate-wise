import { APP_GUARD } from '@nestjs/core';
import { AuthGuard } from 'src/auth/guards/auth.guard';

export const globalGuard = {
    provide: APP_GUARD,
    useClass: AuthGuard,
};
