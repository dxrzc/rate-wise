import { UsersService } from './users.service';
import { UserModel } from './models/user.model';
import { Args, ID, Mutation, Query, Resolver } from '@nestjs/graphql';
import { CreateUserInput } from './dtos/input/create-user.input';

@Resolver(() => UserModel)
export class UsersResolver {
    constructor(private readonly userService: UsersService) {}

    @Query(() => UserModel, { name: 'findUserById' })
    async findOneById(
        @Args('user_id', { type: () => ID }) id: string,
    ): Promise<UserModel> {
        return await this.userService.findOneById(id);
    }

    @Mutation(() => UserModel, { name: 'createUser' })
    async createOne(
        @Args('user_data') user: CreateUserInput,
    ): Promise<UserModel> {
        return await this.userService.createOne(user);
    }
}
