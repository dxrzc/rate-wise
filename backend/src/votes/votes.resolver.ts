import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { VotesService } from './votes.service';
import { RateLimit, RateLimitTier } from 'src/common/decorators/throttling.decorator';
import { RequireAccountStatus } from 'src/common/decorators/min-account-status.decorator';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/users/enums/user-role.enum';
import { voteReviewDocs } from './graphql/docs/voteReview.docs';
import { deleteVoteDocs } from './graphql/docs/deleteVote.docs';
import { RequestContext } from 'src/auth/types/request-context.type';
import { CreateVoteInput } from './graphql/inputs/create-vote.input';
import { ReviewVotesArgs } from './graphql/args/review-votes.args';
import { Public } from 'src/common/decorators/public.decorator';
import { findAllReviewVotesDocs } from './graphql/docs/findAllReviewVotes.docs';
import { VotePaginationModel } from './graphql/models/pagination.model';

@Resolver()
export class VotesResolver {
    constructor(private readonly votesService: VotesService) {}

    @RateLimit(RateLimitTier.RELAXED)
    @RequireAccountStatus(AccountStatus.ACTIVE)
    @Roles(UserRole.REVIEWER)
    @Mutation(() => Boolean, voteReviewDocs)
    async voteReview(
        @Args('vote_data') voteData: CreateVoteInput,
        @Context('req') req: RequestContext,
    ) {
        await this.votesService.voteReview(voteData.reviewId, req.user, voteData.vote);
        return true;
    }

    @RateLimit(RateLimitTier.RELAXED)
    @RequireAccountStatus(AccountStatus.ACTIVE)
    @Roles(UserRole.REVIEWER)
    @Mutation(() => Boolean, deleteVoteDocs)
    async deleteVote(
        @Args('reviewId', { type: () => String }) reviewId: string,
        @Context('req') req: RequestContext,
    ) {
        return await this.votesService.deleteVote(reviewId, req.user);
    }

    @Public()
    @RateLimit(RateLimitTier.BALANCED)
    @Query(() => VotePaginationModel, findAllReviewVotesDocs)
    async findAllVotesForReview(@Args() args: ReviewVotesArgs) {
        return await this.votesService.findAllVotesForReview(args);
    }
}
