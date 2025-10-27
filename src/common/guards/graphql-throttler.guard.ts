import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ThrottlerGuard } from '@nestjs/throttler';
import { IGraphQLContext } from '../interfaces/graphql/graphql-context.interface';
import { GqlHttpError } from '../errors/graphql-http.error';
import { COMMON_MESSAGES } from '../messages/common.messages';

@Injectable()
export class GqlThrottlerGuard extends ThrottlerGuard {
    getRequestResponse(context: ExecutionContext) {
        const gqlCtx = GqlExecutionContext.create(context);
        const ctx = gqlCtx.getContext<IGraphQLContext>();
        return { req: ctx.req, res: ctx.res };
    }

    protected throwThrottlingException(): Promise<void> {
        throw GqlHttpError.TooManyRequests(COMMON_MESSAGES.TOO_MANY_REQUESTS);
    }
}
