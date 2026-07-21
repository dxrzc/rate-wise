import { Args, Context, ID, Query, Resolver } from '@nestjs/graphql';
import { RateLimit, RateLimitTier } from 'src/common/decorators/throttling.decorator';
import { UserModel } from './graphql/models/user.model';
import { UsersService } from './users.service';
import { Public } from 'src/common/decorators/public.decorator';
import { PaginationArgs } from 'src/common/graphql/pagination.args';
import { UserPaginationModel } from './graphql/models/pagination.model';
import { findUserByIdDocs } from './graphql/docs/findUserById.docs';
import { findUserByUsernameDocs } from './graphql/docs/findUserByUsername.docs';
import { findAllUsersDocs } from './graphql/docs/findAllUsers.docs';
import { meDocs } from './graphql/docs/me.docs';
import { RequestContext } from 'src/auth/types/request-context.type';
import { ALL_ROLES, Roles } from 'src/common/decorators/roles.decorator';
import {
    ALL_ACCOUNT_STATUSES,
    RequireAccountStatus,
} from 'src/common/decorators/min-account-status.decorator';

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
    @Query(() => UserModel, findUserByUsernameDocs)
    async findOneByUsername(@Args('username', { type: () => String }) username: string) {
        return await this.userService.findOneByUsernameOrThrow(username);
    }

    @Public()
    @RateLimit(RateLimitTier.BALANCED)
    @Query(() => UserPaginationModel, findAllUsersDocs)
    async findAll(@Args() paginationArgs: PaginationArgs) {
        return await this.userService.findAll(paginationArgs);
    }

    @Roles(ALL_ROLES)
    @RateLimit(RateLimitTier.RELAXED)
    @RequireAccountStatus(ALL_ACCOUNT_STATUSES)
    @Query(() => UserModel, meDocs)
    async me(@Context('req') req: RequestContext) {
        return await this.userService.findOneByIdOrThrowCached(req.user.id);
    }
}
