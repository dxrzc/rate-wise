import { APP_GUARD } from '@nestjs/core';
import { AccountStatusGuard } from 'src/auth/guards/account-status.guard';

export const appAccountStatusGuard = {
    provide: APP_GUARD,
    useClass: AccountStatusGuard,
};
