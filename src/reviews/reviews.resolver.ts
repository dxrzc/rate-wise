import { Args, Context, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ReviewService } from './reviews.service';
import { BalancedThrottle, RelaxedThrottle } from 'src/common/decorators/throttling.decorator';
import { MinAccountStatusRequired } from 'src/common/decorators/min-account-status.decorator';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { RequestContext } from 'src/auth/types/request-context.type';
import { CreateReviewInput } from './dtos/create-review.input';
import { ReviewModel } from './models/review.model';
import { AllRolesAllowed } from 'src/common/decorators/all-roles-allowed.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { ReviewPaginationModel } from './models/pagination.model';
import { ReviewsByUserArgs } from './dtos/args/reviews-by-user.args';
import { ItemReviewsArgs } from './dtos/args/item-reviews.args';
import { createReviewDocs } from './docs/createReview.docs';
import { findAllReviewsByUserDocs } from './docs/findAllReviewsByUser.docs';
import { findAllItemReviewsDocs } from './docs/findAllItemReviews.docs';
import { voteReviewDocs } from './docs/voteReview.docs';

@Resolver()
export class ReviewResolver {
    constructor(private readonly reviewService: ReviewService) {}

    @RelaxedThrottle()
    @MinAccountStatusRequired(AccountStatus.ACTIVE)
    @AllRolesAllowed()
    @Mutation(() => ReviewModel, createReviewDocs)
    async createOne(
        @Args('review_data') review: CreateReviewInput,
        @Context('req') req: RequestContext,
    ) {
        return await this.reviewService.createOne(review, req.user);
    }

    @Public()
    @BalancedThrottle()
    @Query(() => ReviewPaginationModel, findAllReviewsByUserDocs)
    async findAllReviewsByUser(@Args() args: ReviewsByUserArgs) {
        return this.reviewService.findAllByUser(args);
    }

    @Public()
    @BalancedThrottle()
    @Query(() => ReviewPaginationModel, findAllItemReviewsDocs)
    async findAllItemReviews(@Args() args: ItemReviewsArgs) {
        return await this.reviewService.findAllItemReviews(args);
    }

    @RelaxedThrottle()
    @MinAccountStatusRequired(AccountStatus.ACTIVE)
    @AllRolesAllowed()
    @Mutation(() => Boolean, voteReviewDocs)
    async voteReview(
        @Args('review_id', { type: () => ID }) reviewId: string,
        @Context('req') req: RequestContext,
    ) {
        await this.reviewService.voteReview(reviewId, req.user);
        return true;
    }
}
