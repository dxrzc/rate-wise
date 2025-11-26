import {
    Args,
    Context,
    ID,
    Mutation,
    Parent,
    Query,
    ResolveField,
    Resolver,
} from '@nestjs/graphql';
import { RequestContext } from 'src/auth/types/request-context.type';
import { AllRolesAllowed } from 'src/common/decorators/all-roles-allowed.decorator';
import { MinAccountStatusRequired } from 'src/common/decorators/min-account-status.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { BalancedThrottle, RelaxedThrottle } from 'src/common/decorators/throttling.decorator';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { CreateItemInput } from './dtos/create-item.input';
import { ItemsService } from './items.service';
import { ItemModel } from './models/item.model';
import { ItemPaginationModel } from './models/pagination.model';
import { UserReviewsArgs } from './dtos/args/user-reviews.args';
import { ReviewPaginationModel } from 'src/reviews/models/pagination.model';
import { PaginationArgs } from 'src/common/dtos/args/pagination.args';
import { ReviewService } from 'src/reviews/reviews.service';

@Resolver(() => ItemModel)
export class ItemsResolver {
    constructor(
        private readonly itemsService: ItemsService,
        private readonly reviewsService: ReviewService,
    ) {}

    @BalancedThrottle()
    @AllRolesAllowed()
    @MinAccountStatusRequired(AccountStatus.ACTIVE)
    @Mutation(() => ItemModel, { name: 'createItem' })
    async createOne(
        @Args('item_data') item: CreateItemInput,
        @Context('req') req: RequestContext,
    ): Promise<ItemModel> {
        return await this.itemsService.createOne(item, req.user);
    }

    @Public()
    @RelaxedThrottle()
    @Query(() => ItemModel, { name: 'findItemById' })
    async findOneById(@Args('item_id', { type: () => ID }) id: string) {
        return await this.itemsService.findOneByIdOrThrowCached(id);
    }

    @Public()
    @BalancedThrottle()
    @Query(() => ItemPaginationModel, { name: 'findAllItemsByUser' })
    async findAllItemsByUser(@Args() args: UserReviewsArgs) {
        return this.itemsService.findAllByUser(args.userId, {
            limit: args.limit,
            cursor: args.cursor,
        });
    }

    @Public()
    @BalancedThrottle()
    @Query(() => ItemPaginationModel, {
        name: 'findAllItems',
        description: `Find all items with cursored pagination.`,
    })
    async findAll(@Args() paginationArgs: PaginationArgs) {
        return await this.itemsService.findAll(paginationArgs);
    }

    @ResolveField(() => ReviewPaginationModel)
    async reviews(@Args() paginationArgs: PaginationArgs, @Parent() item: ItemModel) {
        return await this.reviewsService.findAllItemReviews({
            ...paginationArgs,
            itemId: item.id,
        });
    }
}
