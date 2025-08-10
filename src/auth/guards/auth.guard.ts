import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import { UsersService } from 'src/users/users.service';
import { Public } from 'src/common/decorators/public.decorator';
import { IGraphQLContext } from '../interfaces/graphql-context.interface';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly userService: UsersService,
        private readonly reflector: Reflector,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const isPublic = this.reflector.get(Public, context.getHandler());
        if (isPublic) {
            return true;
        }

        const graphQLContext = GqlExecutionContext.create(context);
        const reqContext = graphQLContext.getContext<IGraphQLContext>();
        const session = reqContext.req.session;
        if (!session || !session.userId) {
            return false;
        }

        const userInSession = session.userId;
        const user = await this.userService.findOneByIdOrThrow(userInSession);
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const userRole = user.role;

        // TODO: attach to request object

        return true;
    }
}
