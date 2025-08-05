import { UsersService } from './users.service';
import { UserModel } from './models/user.model';
import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { UserPaginationModel } from './models/pagination.model';
import { PaginationArgs } from 'src/common/dtos/args/pagination.args';
import { IPaginatedType } from 'src/common/interfaces/pagination/paginated-type.interface';

@Resolver(() => UserModel)
export class UsersResolver {
    constructor(private readonly userService: UsersService) {}

    @Query(() => UserModel, { name: 'findUserById' })
    async findOneById(
        @Args('user_id', { type: () => ID }) id: string,
    ): Promise<UserModel> {
        return await this.userService.findOneByIdOrThrow(id);
    }

    @Query(() => UserPaginationModel, { name: 'users' })
    async findAll(
        @Args() paginationArgs: PaginationArgs,
    ): Promise<IPaginatedType<UserModel>> {
        return await this.userService.findAll(paginationArgs);
    }
}
