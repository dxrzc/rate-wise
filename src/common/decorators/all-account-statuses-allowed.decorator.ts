import { applyDecorators } from '@nestjs/common';
import { MinAccountStatusRequired } from './min-account-status.decorator';
import { AccountStatus } from 'src/users/enums/account-status.enum';

export function AllAccountStatusesAllowed() {
    return applyDecorators(MinAccountStatusRequired(AccountStatus.SUSPENDED));
}
