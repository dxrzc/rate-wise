import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { VotesService } from './votes.service';
import { BalancedThrottle, RelaxedThrottle } from 'src/common/decorators/throttling.decorator';
import { MinAccountStatusRequired } from 'src/common/decorators/min-account-status.decorator';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/users/enums/user-role.enum';
import { voteReview } from './docs/voteReview.docs';
import { RequestContext } from 'src/auth/types/request-context.type';
import { CreateVoteInput } from './dtos/create-vote.input';
import { ReviewVotesArgs } from './dtos/args/review-votes.args';
import { Public } from 'src/common/decorators/public.decorator';
import { findAllReviewVotesDocs } from './docs/findAllReviewVotes.docs';
import { VotePaginationModel } from './models/pagination.model';

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

    @Public()
    @BalancedThrottle()
    @Query(() => VotePaginationModel, findAllReviewVotesDocs)
    async findAllVotesForReview(@Args() args: ReviewVotesArgs) {
        return await this.votesService.findAllVotesForReview(args);
    }
}
