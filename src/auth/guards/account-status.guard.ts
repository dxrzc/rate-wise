import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlContextType, GqlExecutionContext } from '@nestjs/graphql';
import { MinAccountStatusRequired } from 'src/common/decorators/min-account-status.decorator';
import { Public } from 'src/common/decorators/public.decorator';
import { IGraphQLContext } from 'src/common/interfaces/graphql/graphql-context.interface';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { isAccountStatusAllowed } from '../functions/is-status-allowed';
import { GqlHttpError } from 'src/common/errors/graphql-http.error';
import { AUTH_MESSAGES } from '../messages/auth.messages';
import { AccountStatus } from 'src/users/enums/account-status.enum';

@Injectable()
export class AccountStatusGuard implements CanActivate {
    constructor(
        private readonly logger: HttpLoggerService,
        private readonly reflector: Reflector,
    ) {}

    canActivate(context: ExecutionContext): boolean {
        const isPublic = this.reflector.get(Public, context.getHandler());
        if (isPublic) return true;
        if (context.getType<GqlContextType>() !== 'graphql') {
            throw new Error('Non-gql contexts in AccountStatusGuard not implemented');
        }
        const minStatusRequired = this.reflector.get(
            MinAccountStatusRequired,
            context.getHandler(),
        );

        if (!minStatusRequired) throw new Error('Min account status not specified');

        const graphQLContext = GqlExecutionContext.create(context);
        const reqContext = graphQLContext.getContext<IGraphQLContext>();
        const userAccountStatus = reqContext.req.user.status;
        const userId = reqContext.req.user.id;
        const allowed = isAccountStatusAllowed(minStatusRequired, userAccountStatus);
        if (!allowed) {
            switch (userAccountStatus) {
                case AccountStatus.PENDING_VERIFICATION: {
                    this.logger.error(`Access denied for user ${userId} - account not active`);
                    throw GqlHttpError.Forbidden(AUTH_MESSAGES.ACCOUNT_IS_NOT_ACTIVE);
                }
                case AccountStatus.SUSPENDED:
                    this.logger.error(`Access denied for user ${userId} - account suspended`);
                    throw GqlHttpError.Forbidden(AUTH_MESSAGES.ACCOUNT_IS_SUSPENDED);
            }
        }
        return true;
    }
}
