import { Args, Parent, ResolveField, Resolver } from '@nestjs/graphql';
import { PaginationArgs } from 'src/common/graphql/pagination.args';
import { ItemPaginationModel } from 'src/items/models/pagination.model';
import { ItemsService } from 'src/items/items.service';
import { UserModel } from 'src/users/models/user.model';

@Resolver(() => UserModel)
export class UserItemsResolver {
    constructor(private readonly itemsService: ItemsService) {}

    @ResolveField(() => ItemPaginationModel, {
        description: 'Paginated list of items created by this user.',
    })
    async items(@Parent() user: UserModel, @Args() paginationArgs: PaginationArgs) {
        return this.itemsService.filterItems({
            ...paginationArgs,
            createdBy: user.id,
        });
    }
}
