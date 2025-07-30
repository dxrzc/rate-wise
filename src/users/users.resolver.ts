import { UsersService } from './users.service';
import { UserModel } from './models/user.model';
import { UserPaginationModel } from './models/pagination.model';
import { CreateUserInput } from './dtos/input/create-user.input';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { PaginationArgs } from 'src/common/dtos/args/pagination.args';
import { ICursorPagination } from 'src/common/interfaces/cursor-pagination.interface';

@Resolver(() => UserModel)
export class UsersResolver {
    constructor(private readonly userService: UsersService) {}

    @Query(() => UserModel, { name: 'findUserById' })
    async findOneById(
        @Args('user_id', { type: () => ID }) id: string,
    ): Promise<UserModel> {
        return await this.userService.findOneById(id);
    }

    @Query(() => UserPaginationModel, { name: 'users' })
    async findAll(
        @Args() paginationArgs: PaginationArgs,
    ): Promise<ICursorPagination<UserModel>> {
        return await this.userService.findAll(paginationArgs);
    }

    @Mutation(() => UserModel, { name: 'createUser' })
    async createOne(
        @Args('user_data') user: CreateUserInput,
    ): Promise<UserModel> {
        return await this.userService.createOne(user);
    }
}
