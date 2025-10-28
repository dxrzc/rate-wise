import { UserRole } from 'src/users/enum/user-role.enum';

export interface AuthenticatedUser {
    id: string;
    email: string;
    username: string;
    role: UserRole;
}
