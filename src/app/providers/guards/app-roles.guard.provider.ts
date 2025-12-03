import { APP_GUARD } from '@nestjs/core';
import { RolesGuard } from 'src/auth/guards/roles.guard';

export const appRolesGuard = {
    provide: APP_GUARD,
    useClass: RolesGuard,
};
