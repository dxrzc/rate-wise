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
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/users/enums/user-role.enum';
import { MinAccountStatusRequired } from 'src/common/decorators/min-account-status.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { BalancedThrottle, RelaxedThrottle } from 'src/common/decorators/throttling.decorator';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { CreateItemInput } from './dtos/create-item.input';
import { ItemsService } from './items.service';
import { ItemModel } from './models/item.model';
import { ItemPaginationModel } from './models/pagination.model';
import { ItemsByUserArgs } from './dtos/args/user-reviews.args';
import { ItemsByCategoryArgs } from './dtos/args/items-by-category.args';
import { ItemsByTagArgs } from './dtos/args/items-by-tag.args';
import { ReviewPaginationModel } from 'src/reviews/models/pagination.model';
import { PaginationArgs } from 'src/common/dtos/args/pagination.args';
import { ReviewService } from 'src/reviews/reviews.service';
import { createItemDocs } from './docs/createItem.docs';
import { findItemByIdDocs } from './docs/findItemById.docs';
import { findAllItemsByUserDocs } from './docs/findAllItemsByUser.docs';
import { findAllItemsDocs } from './docs/findAllItems.docs';
import { findAllItemsByCategoryDocs } from './docs/findAllItemsByCategory.docs';
import { findAllItemsByTagDocs } from './docs/findAllItemsByTag.docs';

@Resolver(() => ItemModel)
export class ItemsResolver {
    constructor(
        private readonly itemsService: ItemsService,
        private readonly reviewsService: ReviewService,
    ) {}

    @BalancedThrottle()
    @Roles([UserRole.CREATOR])
    @MinAccountStatusRequired(AccountStatus.ACTIVE)
    @Mutation(() => ItemModel, createItemDocs)
    async createOne(
        @Args('item_data') item: CreateItemInput,
        @Context('req') req: RequestContext,
    ): Promise<ItemModel> {
        return await this.itemsService.createOne(item, req.user);
    }

    @Public()
    @RelaxedThrottle()
    @Query(() => ItemModel, findItemByIdDocs)
    async findOneById(@Args('item_id', { type: () => ID }) id: string) {
        return await this.itemsService.findOneByIdOrThrowCached(id);
    }

    @Public()
    @BalancedThrottle()
    @Query(() => ItemPaginationModel, findAllItemsByUserDocs)
    async findAllItemsByUser(@Args() args: ItemsByUserArgs) {
        return this.itemsService.findAllByUser(args.userId, {
            limit: args.limit,
            cursor: args.cursor,
        });
    }

    @Public()
    @BalancedThrottle()
    @Query(() => ItemPaginationModel, findAllItemsDocs)
    async findAll(@Args() paginationArgs: PaginationArgs) {
        return await this.itemsService.findAll(paginationArgs);
    }

    @Public()
    @BalancedThrottle()
    @Query(() => ItemPaginationModel, findAllItemsByCategoryDocs)
    async findAllItemsByCategory(@Args() args: ItemsByCategoryArgs) {
        return this.itemsService.findAllByCategory(args.category, {
            limit: args.limit,
            cursor: args.cursor,
        });
    }

    @Public()
    @BalancedThrottle()
    @Query(() => ItemPaginationModel, findAllItemsByTagDocs)
    async findAllItemsByTag(@Args() args: ItemsByTagArgs) {
        return this.itemsService.findAllByTag(args.tag, {
            limit: args.limit,
            cursor: args.cursor,
        });
    }

    @ResolveField(() => ReviewPaginationModel, {
        description: 'Paginated list of reviews for this item.',
    })
    async reviews(@Args() paginationArgs: PaginationArgs, @Parent() item: ItemModel) {
        return await this.reviewsService.findAllItemReviews({
            ...paginationArgs,
            itemId: item.id,
        });
    }
}
