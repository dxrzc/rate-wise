import { Args, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PaginationArgs } from 'src/common/dtos/args/pagination.args';
import { ReviewModel } from 'src/reviews/models/review.model';
import { VotePaginationModel } from './models/pagination.model';
import { VotesService } from './votes.service';

@Resolver(() => ReviewModel)
export class ReviewVotesResolver {
    constructor(private readonly votesService: VotesService) {}

    @ResolveField(() => VotePaginationModel, {
        description: 'Paginated list of votes for this review.',
    })
    async votes(@Args() paginationArgs: PaginationArgs, @Parent() review: ReviewModel) {
        return await this.votesService.findAllVotesForReview({
            ...paginationArgs,
            reviewId: review.id,
        });
    }
}
