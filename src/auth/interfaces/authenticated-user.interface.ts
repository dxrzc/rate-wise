import { UserRole } from 'src/users/enums/user-role.enum';
import { AccountStatus } from 'src/users/enums/account-status.enum';

export interface AuthenticatedUser {
    readonly id: string;
    readonly email: string;
    readonly username: string;
    readonly status: AccountStatus;
    readonly roles: UserRole[];
}
