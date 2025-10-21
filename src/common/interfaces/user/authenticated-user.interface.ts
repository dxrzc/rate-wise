import { UserRole } from 'src/users/enum/user-role.enum';

export interface AuthenticatedUser {
    id: string;
    email: string;
    role: UserRole;
}
