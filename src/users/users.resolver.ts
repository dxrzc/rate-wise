import { Args, ID, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { BalancedThrottle, RelaxedThrottle } from 'src/common/decorators/throttling.decorator';
import { UserModel } from './models/user.model';
import { UsersService } from './users.service';
import { Public } from 'src/common/decorators/public.decorator';
import { PaginationArgs } from 'src/common/dtos/args/pagination.args';
import { UserPaginationModel } from './models/pagination.model';
import { ItemPaginationModel } from 'src/items/models/pagination.model';
import { ItemsService } from 'src/items/items.service';
import { findUserByIdDocs } from './docs/findUserById.docs';
import { findAllUsersDocs } from './docs/findAllUsers.docs';

@Resolver(() => UserModel)
export class UsersResolver {
    constructor(
        private readonly userService: UsersService,
        private readonly itemsService: ItemsService,
    ) {}

    @Public()
    @RelaxedThrottle()
    @Query(() => UserModel, findUserByIdDocs)
    async findOneById(@Args('user_id', { type: () => ID }) id: string) {
        return await this.userService.findOneByIdOrThrowCached(id);
    }

    @ResolveField(() => ItemPaginationModel, {
        description: 'Paginated list of items created by this user.',
    })
    async items(@Args() paginationArgs: PaginationArgs, @Parent() user: UserModel) {
        const items = await this.itemsService.filterItems({
            ...paginationArgs,
            createdBy: user.id,
        });
        return items;
    }

    @Public()
    @BalancedThrottle()
    @Query(() => UserPaginationModel, findAllUsersDocs)
    async findAll(@Args() paginationArgs: PaginationArgs) {
        return await this.userService.findAll(paginationArgs);
    }
}
