import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { IGraphQLContext } from '../interfaces/graphql-context.interface';
import { Public } from 'src/common/decorators/public.decorator';
import { AUTH_MESSAGES } from '../messages/auth.messages';
import { GraphQLHttpError } from 'src/common/errors/graphql-http.error';
import { UsersService } from 'src/users/users.service';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Reflector } from '@nestjs/core';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { AuthenticatedUser } from 'src/common/interfaces/user/authenticated-user.interface';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly userService: UsersService,
        private readonly logger: HttpLoggerService,
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
            this.logger.error('Authentication required');
            throw GraphQLHttpError.Unauthorized(AUTH_MESSAGES.UNAUTHORIZED);
        }

        const userInSession = session.userId;
        const user = await this.userService.findOneByIdOrThrow(userInSession);
        const userRole = user.role;

        this.logger.info(`Access granted for user ${user.id} (${userRole})`);

        const userInfo: AuthenticatedUser = {
            id: user.id,
            role: user.role,
            email: user.email,
        };
        Object.assign(reqContext.req, { user: userInfo });

        return true;
    }
}
