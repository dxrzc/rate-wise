import { applyDecorators } from '@nestjs/common';
import { Roles } from './roles.decorator';
import { UserRole } from 'src/users/enums/user-role.enum';

export function AllRolesAllowed() {
    return applyDecorators(
        Roles([UserRole.ADMIN, UserRole.REVIEWER, UserRole.CREATOR, UserRole.MODERATOR]),
    );
}
