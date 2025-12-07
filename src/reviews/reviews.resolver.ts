import { Args, Context, Mutation, Query, Resolver } from '@nestjs/graphql';
import { ReviewService } from './reviews.service';
import { BalancedThrottle, RelaxedThrottle } from 'src/common/decorators/throttling.decorator';
import { MinAccountStatusRequired } from 'src/common/decorators/min-account-status.decorator';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { RequestContext } from 'src/auth/types/request-context.type';
import { CreateReviewInput } from './dtos/create-review.input';
import { ReviewModel } from './models/review.model';
import { Public } from 'src/common/decorators/public.decorator';
import { ReviewPaginationModel } from './models/pagination.model';
import { ReviewsByUserArgs } from './dtos/args/reviews-by-user.args';
import { ItemReviewsArgs } from './dtos/args/item-reviews.args';
import { createReviewDocs } from './docs/createReview.docs';
import { findAllReviewsByUserDocs } from './docs/findAllReviewsByUser.docs';
import { findAllItemReviewsDocs } from './docs/findAllItemReviews.docs';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/users/enums/user-role.enum';

@Resolver()
export class ReviewResolver {
    constructor(private readonly reviewService: ReviewService) {}

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
}
