import { Args, Context, Mutation, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { ReviewService } from './reviews.service';
import { BalancedThrottle, RelaxedThrottle } from 'src/common/decorators/throttling.decorator';
import { MinAccountStatusRequired } from 'src/common/decorators/min-account-status.decorator';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { RequestContext } from 'src/auth/types/request-context.type';
import { CreateReviewInput } from './dtos/create-review.input';
import { ReviewModel } from './models/review.model';
import { Public } from 'src/common/decorators/public.decorator';
import { ReviewPaginationModel } from './models/pagination.model';
import { createReviewDocs } from './docs/createReview.docs';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/users/enums/user-role.enum';
import { VotePaginationModel } from 'src/votes/models/pagination.model';
import { PaginationArgs } from 'src/common/dtos/args/pagination.args';
import { Review } from './entities/review.entity';
import { VotesService } from 'src/votes/votes.service';
import { ReviewFiltersArgs } from './dtos/args/review.filters.args';
import { filterReviewsDocs } from './docs/filterReviews.docs';

@Resolver(() => ReviewModel)
export class ReviewResolver {
    constructor(
        private readonly reviewService: ReviewService,
        private readonly votesService: VotesService,
    ) {}

    @RelaxedThrottle()
    @MinAccountStatusRequired(AccountStatus.ACTIVE)
    @Roles([UserRole.REVIEWER])
    @Mutation(() => ReviewModel, createReviewDocs)
    async createOne(
        @Args('review_data') review: CreateReviewInput,
        @Context('req') req: RequestContext,
    ) {
        return await this.reviewService.createOne(review, req.user);
    }

    @Public()
    @BalancedThrottle()
    @Query(() => ReviewPaginationModel, filterReviewsDocs)
    async filterReviews(@Args() filters: ReviewFiltersArgs) {
        return await this.reviewService.filterReviews(filters);
    }

    @ResolveField(() => VotePaginationModel, {
        description: 'Paginated list of votes for this review.',
    })
    async votes(@Args() paginationArgs: PaginationArgs, @Parent() review: Review) {
        return await this.votesService.findAllVotesForReview({
            ...paginationArgs,
            reviewId: review.id,
        });
    }
}
