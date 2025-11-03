/* eslint-disable @typescript-eslint/require-await */
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { GqlExecutionContext } from '@nestjs/graphql';
import {
    ThrottlerGuard,
    ThrottlerLimitDetail,
    ThrottlerOptions,
    ThrottlerStorage,
} from '@nestjs/throttler';
import { RequestContext } from 'src/auth/types/request-context.type';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { GqlHttpError } from '../errors/graphql-http.error';
import { IGraphQLContext } from '../interfaces/graphql/graphql-context.interface';
import { COMMON_MESSAGES } from '../messages/common.messages';
import { Request, Response } from 'express';
import { TooManyRequestsException } from '../errors/http.exceptions';

// Supports GraphQL & REST
@Injectable()
export class RateLimiterGuard extends ThrottlerGuard {
    constructor(
        options: ThrottlerOptions[],
        storageService: ThrottlerStorage,
        reflector: Reflector,
        private readonly logger: HttpLoggerService,
    ) {
        super(options, storageService, reflector);
    }

    // Uses user ID as tracker if authenticated, otherwise falls back to IP address
    async getTracker(req: Record<string, any>): Promise<string> {
        const typedReq = req as RequestContext;
        return typedReq.user ? typedReq.user.id : typedReq.ip!;
    }

    getRequestResponse(context: ExecutionContext) {
        // REST
        if (context.getType() === 'http') {
            const http = context.switchToHttp();
            return {
                req: http.getRequest<Request>(),
                res: http.getResponse<Response>(),
            };
        }
        // GraphQL
        const gqlCtx = GqlExecutionContext.create(context);
        const ctx = gqlCtx.getContext<IGraphQLContext>();
        return { req: ctx.req, res: ctx.res };
    }

    async throwThrottlingException(
        context: ExecutionContext,
        { limit, ttl }: ThrottlerLimitDetail,
    ): Promise<void> {
        this.logger.error(`More than ${limit} requests in ${ttl}ms`);
        // REST
        if (context.getType() === 'http') throw new TooManyRequestsException();
        // GraphQL
        throw GqlHttpError.TooManyRequests(COMMON_MESSAGES.TOO_MANY_REQUESTS);
    }
}
