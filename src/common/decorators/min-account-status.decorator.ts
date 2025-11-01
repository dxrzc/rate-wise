import { Reflector } from '@nestjs/core';
import { AccountStatus } from 'src/users/enums/account-status.enum';

export const MinAccountStatusRequired =
    Reflector.createDecorator<AccountStatus>();
