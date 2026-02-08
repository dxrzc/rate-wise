import { Args, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PaginationArgs } from 'src/common/graphql/pagination.args';
import { ReviewModel } from 'src/reviews/graphql/models/review.model';
import { VotesService } from './votes.service';
import { VotePaginationModel } from './graphql/models/pagination.model';

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
