import { Injectable } from '@nestjs/common';
import { AUTH_MESSAGES } from 'src/auth/messages/auth.messages';
import { GqlHttpError } from 'src/common/errors/graphql-http.error';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { UserRole } from 'src/users/enums/user-role.enum';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ModerationService {
    constructor(
        private readonly userService: UsersService,
        private readonly logger: HttpLoggerService,
    ) {}

    async suspendAccount(userId: string): Promise<void> {
        const targetUser = await this.userService.findOneByIdOrThrow(userId);
        if (targetUser.roles.includes(UserRole.ADMIN)) {
            this.logger.warn(`Admin user ${targetUser.id} cannot be suspended`);
            throw GqlHttpError.Forbidden(AUTH_MESSAGES.FORBIDDEN);
        }
        if (targetUser.roles.includes(UserRole.MODERATOR)) {
            this.logger.warn(`Moderator user ${targetUser.id} cannot be suspended`);
            throw GqlHttpError.Forbidden(AUTH_MESSAGES.FORBIDDEN);
        }
        if (targetUser.status === AccountStatus.SUSPENDED) {
            this.logger.warn(`User ${targetUser.id} is already suspended`);
            throw GqlHttpError.Conflict(AUTH_MESSAGES.ACCOUNT_ALREADY_SUSPENDED);
        }
        targetUser.status = AccountStatus.SUSPENDED;
        await this.userService.saveOne(targetUser);
        this.logger.info(`User ${targetUser.id} account suspended`);
    }
}
