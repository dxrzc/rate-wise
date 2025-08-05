import { ItemsService } from './items.service';
import { ItemModel } from './models/item.model';
import { ItemPaginationModel } from './models/pagination.model';
import { CreateItemInput } from './dtos/input/create-item.input';
import { PaginationArgs } from 'src/common/dtos/args/pagination.args';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { IPaginatedType } from 'src/common/interfaces/paginated-type.interface';

@Resolver(() => ItemModel)
export class ItemsResolver {
    constructor(private readonly itemsService: ItemsService) {}

    @Query(() => ItemModel, { name: 'findItemById' })
    async findOneById(@Args('item_id', { type: () => ID }) id: string) {
        return await this.itemsService.findOneById(id);
    }

    @Query(() => ItemPaginationModel, { name: 'users' })
    async findAll(
        @Args() paginationArgs: PaginationArgs,
    ): Promise<IPaginatedType<ItemModel>> {
        return await this.itemsService.findAll(paginationArgs);
    }

    @Mutation(() => ItemModel, { name: 'createItem' })
    async createOne(
        @Args('item_data') item: CreateItemInput,
    ): Promise<ItemModel> {
        return await this.itemsService.createOne(item);
    }

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
