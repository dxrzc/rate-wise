import { Args, Context, Mutation, Resolver } from '@nestjs/graphql';
import { ReviewService } from './reviews.service';
import { RelaxedThrottle } from 'src/common/decorators/throttling.decorator';
import { MinAccountStatusRequired } from 'src/common/decorators/min-account-status.decorator';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { RequestContext } from 'src/auth/types/request-context.type';
import { CreateReviewInput } from './dtos/create-review.input';
import { ReviewModel } from './models/review.model';
import { AllRolesAllowed } from 'src/common/decorators/all-roles-allowed.decorator';

@Resolver()
export class ReviewResolver {
    constructor(private readonly reviewService: ReviewService) {}

    @RelaxedThrottle()
    @MinAccountStatusRequired(AccountStatus.ACTIVE)
    @AllRolesAllowed()
    @Mutation(() => ReviewModel, { name: 'createReview' })
    async createOne(
        @Args('review_data') review: CreateReviewInput,
        @Context('req') req: RequestContext,
    ) {
        return await this.reviewService.createOne(review, req.user);
    }
}
