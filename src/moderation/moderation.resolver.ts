import { Args, ID, Mutation, Resolver } from '@nestjs/graphql';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/users/enums/user-role.enum';
import { ModerationService } from './moderation.service';
import { RequireAccountStatus } from 'src/common/decorators/min-account-status.decorator';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { RateLimit, RateLimitTier } from 'src/common/decorators/throttling.decorator';
import { suspendAccountDocs } from './docs/suspendAccount.docs';

@Resolver()
@Roles(UserRole.MODERATOR)
@RequireAccountStatus(AccountStatus.ACTIVE)
export class ModerationResolver {
    constructor(private readonly moderationService: ModerationService) {}

    @RateLimit(RateLimitTier.CRITICAL)
    @Mutation(() => Boolean, suspendAccountDocs)
    async suspendAccount(@Args('user_id', { type: () => ID }) userId: string): Promise<boolean> {
        await this.moderationService.suspendAccount(userId);
        return true;
    }
}
