import { Args, Float, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PaginationArgs } from 'src/common/graphql/pagination.args';
import { ItemModel } from 'src/items/graphql/models/item.model';
import { ReviewPaginationModel } from './graphql/models/pagination.model';
import { ReviewService } from './reviews.service';

@Resolver(() => ItemModel)
export class ItemReviewsResolver {
    constructor(private readonly reviewService: ReviewService) {}

    @ResolveField(() => Float, {
        description: 'The average rating of the item based on all reviews.',
    })
    async averageRating(@Parent() item: ItemModel): Promise<number> {
        return await this.reviewService.calculateItemAverageRating(item.id);
    }

    @ResolveField(() => ReviewPaginationModel, {
        description: 'Paginated list of reviews for this item.',
    })
    async reviews(@Args() paginationArgs: PaginationArgs, @Parent() item: ItemModel) {
        return await this.reviewService.filterReviews({
            ...paginationArgs,
            relatedItem: item.id,
        });
    }
}
