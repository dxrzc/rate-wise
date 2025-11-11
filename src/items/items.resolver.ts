import { Args, Context, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { RequestContext } from 'src/auth/types/request-context.type';
import { AllRolesAllowed } from 'src/common/decorators/all-roles-allowed.decorator';
import { MinAccountStatusRequired } from 'src/common/decorators/min-account-status.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { BalancedThrottle, RelaxedThrottle } from 'src/common/decorators/throttling.decorator';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { CreateItemInput } from './dtos/create-item.input';
import { ItemsService } from './items.service';
import { ItemModel } from './models/item.model';

@Resolver(() => ItemModel)
export class ItemsResolver {
    constructor(private readonly itemsService: ItemsService) {}

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

    @RelaxedThrottle()
    @Public()
    @Query(() => ItemModel, { name: 'findItemById' })
    async findOneById(@Args('item_id', { type: () => ID }) id: string) {
        return await this.itemsService.findOneByIdOrThrowCached(id);
    }

    // public
    // @Query(() => ItemPaginationModel, { name: 'users' })
    // async findAll(@Args() paginationArgs: PaginationArgs): Promise<IPaginatedType<ItemModel>> {
    //     return await this.itemsService.findAll(paginationArgs);
    // }

    // @Mutation(() => ItemModel, { name: 'updateItem' })
    // updateItem(
    //     @Args('item_id', { type: () => Int }) id: number,
    //     @Args('input_data') data: UpdateItemInput,
    // ) {
    //     return this.itemsService.updateOne(id, data);
    // }

    // @Mutation(() => Boolean)
    // deleteOne(@Args('item_id', { type: () => Int }) id: number) {
    //     return this.itemsService.deleteOne(id);
    // }
}
