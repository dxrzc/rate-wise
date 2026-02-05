import { Args, ID, Query, Resolver } from '@nestjs/graphql';
import { RateLimit, RateLimitTier } from 'src/common/decorators/throttling.decorator';
import { UserModel } from './models/user.model';
import { UsersService } from './users.service';
import { Public } from 'src/common/decorators/public.decorator';
import { PaginationArgs } from 'src/common/graphql/pagination.args';
import { UserPaginationModel } from './models/pagination.model';
import { findUserByIdDocs } from './docs/findUserById.docs';
import { findAllUsersDocs } from './docs/findAllUsers.docs';

@Resolver(() => UserModel)
export class UsersResolver {
    constructor(private readonly userService: UsersService) {}

    @Public()
    @RateLimit(RateLimitTier.RELAXED)
    @Query(() => UserModel, findUserByIdDocs)
    async findOneById(@Args('user_id', { type: () => ID }) id: string) {
        return await this.userService.findOneByIdOrThrowCached(id);
    }

    @Public()
    @RateLimit(RateLimitTier.BALANCED)
    @Query(() => UserPaginationModel, findAllUsersDocs)
    async findAll(@Args() paginationArgs: PaginationArgs) {
        return await this.userService.findAll(paginationArgs);
    }
}
