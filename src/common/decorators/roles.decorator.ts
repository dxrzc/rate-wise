import { Reflector } from '@nestjs/core';
import { UserRole } from 'src/users/enums/user-role.enum';

export const Roles = Reflector.createDecorator<UserRole[]>();
