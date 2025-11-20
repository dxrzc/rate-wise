import { Args, ID, Parent, Query, ResolveField, Resolver } from '@nestjs/graphql';
import { BalancedThrottle, RelaxedThrottle } from 'src/common/decorators/throttling.decorator';
import { UserModel } from './models/user.model';
import { UsersService } from './users.service';
import { Public } from 'src/common/decorators/public.decorator';
import { PaginationArgs } from 'src/common/dtos/args/pagination.args';
import { UserPaginationModel } from './models/pagination.model';
import { ItemPaginationModel } from 'src/items/models/pagination.model';
import { ItemsService } from 'src/items/items.service';

@Resolver(() => UserModel)
export class UsersResolver {
    constructor(
        private readonly userService: UsersService,
        private readonly itemsService: ItemsService,
    ) {}

    @Public()
    @RelaxedThrottle()
    @Query(() => UserModel, {
        name: 'findUserById',
        description: `Find a user by their unique ID.`,
    })
    async findOneById(@Args('user_id', { type: () => ID }) id: string) {
        return await this.userService.findOneByIdOrThrowCached(id);
    }

    @ResolveField(() => ItemPaginationModel)
    async items(@Args() paginationArgs: PaginationArgs, @Parent() user: UserModel) {
        const items = await this.itemsService.findAllByUser(user.id, paginationArgs);
        return items;
    }

    @Public()
    @BalancedThrottle()
    @Query(() => UserPaginationModel, {
        name: 'findAllUsers',
        description: `Find all users with cursored pagination.`,
    })
    async findAll(@Args() paginationArgs: PaginationArgs) {
        return await this.userService.findAll(paginationArgs);
    }
}
