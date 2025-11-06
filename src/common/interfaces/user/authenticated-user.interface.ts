import { UserRole } from 'src/users/enums/user-role.enum';
import { AccountStatus } from 'src/users/enums/account-status.enum';

export interface AuthenticatedUser {
    id: string;
    email: string;
    username: string;
    status: AccountStatus;
    roles: UserRole[];
}
