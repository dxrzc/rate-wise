import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { IGraphQLContext } from '../../common/graphql/graphql-context.interface';
import { Public } from 'src/common/decorators/public.decorator';
import { AUTH_MESSAGES } from '../messages/auth.messages';
import { GqlHttpError } from 'src/common/errors/graphql-http.error';
import { UsersService } from 'src/users/users.service';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { Reflector } from '@nestjs/core';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { AuthenticatedUser } from 'src/auth/interfaces/authenticated-user.interface';
import { SessionsService } from 'src/sessions/sessions.service';
import { ISessionDetails } from 'src/sessions/interfaces/session.details.interface';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(
        private readonly userService: UsersService,
        private readonly logger: HttpLoggerService,
        private readonly reflector: Reflector,
        private readonly sessionService: SessionsService,
    ) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        // Works for both REST & GraphQL
        const isPublic = this.reflector.get(Public, context.getHandler());
        if (isPublic) {
            return true;
        }

        // non-GraphQL
        if (context.getType<GqlContextType>() !== 'graphql') {
            throw new Error('Non-gql contexts in AuthGuard not implemented');
        }

        const graphQLContext = GqlExecutionContext.create(context);
        const reqContext = graphQLContext.getContext<IGraphQLContext>();
        const session = reqContext.req.session;
        if (!session || !session.userId) {
            this.logger.error('Authentication required');
            throw GqlHttpError.Unauthorized(AUTH_MESSAGES.UNAUTHORIZED);
        }

        const sessionUserId = session.userId;
        const user = await this.userService.findOneById(sessionUserId);
        const sessionDetails: ISessionDetails = { sessId: session.id, userId: sessionUserId };
        if (!user) {
            this.logger.warn(`Zombie session detected: user "${sessionUserId}" not found`);
            await this.sessionService.trySessionCleanup(reqContext.req);
            this.logger.info('Zombie session deleted completely');
            throw GqlHttpError.Unauthorized(AUTH_MESSAGES.UNAUTHORIZED);
        }

        const isDanglingSession = await this.sessionService.isDangling(sessionDetails);
        if (isDanglingSession) {
            this.logger.warn('Dangling session detected');
            await this.sessionService.trySessionCleanup(reqContext.req);
            this.logger.info('Dangling session deleted completely');
            throw GqlHttpError.Unauthorized(AUTH_MESSAGES.UNAUTHORIZED);
        }

        this.logger.info(`Access granted for user ${user.id}`);

        const userInfo: AuthenticatedUser = {
            id: user.id,
            roles: user.roles,
            email: user.email,
            status: user.status,
            username: user.username,
        };
        Object.assign(reqContext.req, { user: userInfo });

        return true;
    }
}
