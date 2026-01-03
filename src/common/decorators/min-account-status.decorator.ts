import { SetMetadata } from '@nestjs/common';
import { AccountStatus } from 'src/users/enums/account-status.enum';

export const ALL_ACCOUNT_STATUSES: AccountStatus[] = Object.values(AccountStatus);

export const ACCOUNT_STATUS_KEY = 'account_status';

export const RequireAccountStatus = (
    ...statuses: AccountStatus[] | [AccountStatus[]]
): MethodDecorator & ClassDecorator => {
    const flatStatuses = statuses.flat();
    return SetMetadata(ACCOUNT_STATUS_KEY, flatStatuses);
};
