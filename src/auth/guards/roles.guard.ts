import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { Public } from 'src/common/decorators/public.decorator';
import { ROLES_KEY } from 'src/common/decorators/roles.decorator';
import { GqlHttpError } from 'src/common/errors/graphql-http.error';
import { IGraphQLContext } from 'src/common/interfaces/graphql/graphql-context.interface';
import { AUTH_MESSAGES } from '../messages/auth.messages';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { UserRole } from 'src/users/enums/user-role.enum';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(
        private readonly reflector: Reflector,
        private readonly logger: HttpLoggerService,
    ) {}

    canActivate(context: ExecutionContext): boolean {
        const isPublic = this.reflector.getAllAndOverride(Public, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) return true;

        if (context.getType<GqlContextType>() !== 'graphql')
            throw new Error('Non-gql contexts in RolesGuard not implemented');

        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (!requiredRoles) throw new Error('Roles not specified for RolesGuard');

        const graphQLContext = GqlExecutionContext.create(context);
        const reqContext = graphQLContext.getContext<IGraphQLContext>();
        const user = reqContext.req.user;

        const allowed = requiredRoles.some((role) => user.roles?.includes(role));
        if (!allowed) {
            this.logger.error(`Access denied for user ${user.id} - insufficient roles`);
            throw GqlHttpError.Forbidden(AUTH_MESSAGES.FORBIDDEN);
        }
        return true;
    }
}
