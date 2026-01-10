import { Args, Context, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { RequestContext } from 'src/auth/types/request-context.type';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/users/enums/user-role.enum';
import { RequireAccountStatus } from 'src/common/decorators/min-account-status.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { RateLimit, RateLimitTier } from 'src/common/decorators/throttling.decorator';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { CreateItemInput } from './dtos/create-item.input';
import { ItemsService } from './items.service';
import { ItemModel } from './models/item.model';
import { ItemPaginationModel } from './models/pagination.model';
import { createItemDocs } from './docs/createItem.docs';
import { findItemByIdDocs } from './docs/findItemById.docs';
import { filterItemsDocs } from './docs/filterItems.docs';
import { ItemFiltersArgs } from './dtos/args/item-filters.args';

@Resolver(() => ItemModel)
export class ItemsResolver {
    constructor(private readonly itemsService: ItemsService) {}

    @RateLimit(RateLimitTier.BALANCED)
    @Roles(UserRole.CREATOR)
    @RequireAccountStatus(AccountStatus.ACTIVE)
    @Mutation(() => ItemModel, createItemDocs)
    async createOne(
        @Args('item_data') item: CreateItemInput,
        @Context('req') req: RequestContext,
    ): Promise<ItemModel> {
        return await this.itemsService.createOne(item, req.user);
    }

    @Public()
    @RateLimit(RateLimitTier.RELAXED)
    @Query(() => ItemModel, findItemByIdDocs)
    async findOneById(@Args('item_id', { type: () => ID }) id: string) {
        return await this.itemsService.findOneByIdOrThrowCached(id);
    }

    @Public()
    @RateLimit(RateLimitTier.BALANCED)
    @Query(() => ItemPaginationModel, filterItemsDocs)
    async filterItems(@Args() filters: ItemFiltersArgs) {
        return await this.itemsService.filterItems(filters);
    }
}
