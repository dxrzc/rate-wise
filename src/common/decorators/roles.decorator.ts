import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'src/users/enums/user-role.enum';

export const ALL_ROLES: UserRole[] = Object.values(UserRole);

export const ROLES_KEY = 'roles';

export const Roles = (...roles: UserRole[] | [UserRole[]]) => {
    const flatRoles = roles.flat();
    return SetMetadata(ROLES_KEY, flatRoles);
};
