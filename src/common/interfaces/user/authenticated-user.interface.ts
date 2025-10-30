import { UserRole } from 'src/users/enum/user-role.enum';
import { UserStatus } from 'src/users/enum/user-status.enum';

export interface AuthenticatedUser {
    id: string;
    email: string;
    username: string;
    status: UserStatus;
    role: UserRole;
}
