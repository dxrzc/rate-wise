import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { BalancedThrottle, RelaxedThrottle } from 'src/common/decorators/throttling.decorator';
import { UserModel } from './models/user.model';
import { UsersService } from './users.service';
import { Public } from 'src/common/decorators/public.decorator';
import { PaginationArgs } from 'src/common/dtos/args/pagination.args';
import { UserPaginationModel } from './models/pagination.model';
import { IPaginatedType } from 'src/pagination/interfaces/paginated-type.interface';
import { User } from './entities/user.entity';

@Resolver(() => UserModel)
export class UsersResolver {
    constructor(private readonly userService: UsersService) {}

    @Public()
    @RelaxedThrottle()
    @Query(() => UserModel, { name: 'findUserById' })
    async findOneById(@Args('user_id', { type: () => ID }) id: string): Promise<UserModel> {
        return await this.userService.findUserAndItemsOrThrowCached(id);
    }

    // TODO: returns items too
    @Public()
    @BalancedThrottle()
    @Query(() => UserPaginationModel, { name: 'users' })
    async findAll(@Args() paginationArgs: PaginationArgs): Promise<IPaginatedType<User>> {
        return await this.userService.findAll(paginationArgs);
    }
}
