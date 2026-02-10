import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ReviewService } from './reviews.service';
import { RateLimit, RateLimitTier } from 'src/common/decorators/throttling.decorator';
import { RequireAccountStatus } from 'src/common/decorators/min-account-status.decorator';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { RequestContext } from 'src/auth/types/request-context.type';
import { ReviewModel } from './graphql/models/review.model';
import { Public } from 'src/common/decorators/public.decorator';
import { ReviewPaginationModel } from './graphql/models/pagination.model';
import { createReviewDocs } from './graphql/docs/createReview.docs';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/users/enums/user-role.enum';
import { filterReviewsDocs } from './graphql/docs/filterReviews.docs';
import { CreateReviewInput } from './graphql/inputs/create-review.input';
import { ReviewFiltersArgs } from './graphql/args/review-filters.args';

@Resolver(() => ReviewModel)
export class ReviewResolver {
    constructor(private readonly reviewService: ReviewService) {}

    @RateLimit(RateLimitTier.RELAXED)
    @RequireAccountStatus(AccountStatus.ACTIVE)
    @Roles(UserRole.REVIEWER)
    @Mutation(() => ReviewModel, createReviewDocs)
    async createOne(
        @Args('review_data') review: CreateReviewInput,
        @Context('req') req: RequestContext,
    ) {
        return await this.reviewService.createOne(review, req.user);
    }

    @Public()
    @RateLimit(RateLimitTier.BALANCED)
    @Query(() => ReviewPaginationModel, filterReviewsDocs)
    async filterReviews(@Args() filters: ReviewFiltersArgs) {
        return await this.reviewService.filterReviews(filters);
    }
}
