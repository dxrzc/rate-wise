import {
    CanActivate,
    ExecutionContext,
    Injectable,
    UnauthorizedException,
} from '@nestjs/common';
import { IGraphQLContext } from '../interfaces/graphql-context.interface';
import { HttpLoggerService } from 'src/logging/http/http-logger.service';
import { AUTHENTICATION_REQUIRED } from '../constants/errors.constants';
import { Public } from 'src/common/decorators/public.decorator';
import { UsersService } from 'src/users/users.service';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Reflector } from '@nestjs/core';

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
            throw new UnauthorizedException(AUTHENTICATION_REQUIRED);
        }

        const userInSession = session.userId;
        const user = await this.userService.findOneByIdOrThrow(userInSession);
        const userRole = user.role;

        this.logger.info(`Access granted for user ${user.id} (${userRole})`);

        // TODO: attach to request object

        return true;
    }
}
