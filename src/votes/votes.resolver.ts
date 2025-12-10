import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { VotesService } from './votes.service';
import { RelaxedThrottle } from 'src/common/decorators/throttling.decorator';
import { MinAccountStatusRequired } from 'src/common/decorators/min-account-status.decorator';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/users/enums/user-role.enum';
import { voteReview } from './docs/voteReview.docs';
import { RequestContext } from 'src/auth/types/request-context.type';
import { CreateVoteInput } from './dtos/create-vote.input';

@Resolver()
export class VotesResolver {
    constructor(private readonly votesService: VotesService) {}

    @RelaxedThrottle()
    @MinAccountStatusRequired(AccountStatus.ACTIVE)
    @Roles([UserRole.REVIEWER])
    @Mutation(() => Boolean, voteReview)
    async voteReview(
        @Args('vote_data') voteData: CreateVoteInput,
        @Context('req') req: RequestContext,
    ) {
        await this.votesService.voteReview(voteData.reviewId, req.user, voteData.vote);
        return true;
    }
}
