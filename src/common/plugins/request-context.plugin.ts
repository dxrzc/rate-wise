/* eslint-disable @typescript-eslint/require-await */
import {
    ApolloServerPlugin,
    GraphQLRequestContext,
    GraphQLRequestContextWillSendResponse,
} from '@apollo/server';
import { IGraphQLContext } from 'src/auth/interfaces/graphql-context.interface';
import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { Plugin } from '@nestjs/apollo';
import { v4 as uuidv4 } from 'uuid';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';

@Plugin()
@Injectable()
export class RequestContextPlugin implements ApolloServerPlugin {
    constructor(
        private readonly logger: HttpLoggerService,
        private readonly cls: ClsService,
    ) {}

    async requestDidStart(reqCtx: GraphQLRequestContext<IGraphQLContext>) {
        const method = reqCtx.request.operationName!;
        if (method !== 'IntrospectionQuery') {
            const request = reqCtx.contextValue.req;
            const now = Date.now();
            const reqIp = request.ip!;
            const reqId = uuidv4();

            this.cls.set('ip', reqIp);
            this.cls.set('requestId', reqId);
            this.cls.set('method', method);

            return {
                willSendResponse: async (
                    reqCtx: GraphQLRequestContextWillSendResponse<IGraphQLContext>,
                ) => {
                    const error = reqCtx.errors?.at(0)?.message;
                    const responseTime = Date.now() - now;
                    this.logger.info(`Request completed (${responseTime}ms)`);
                    this.logger.request({
                        responseTime: `${responseTime}ms`,
                        requestId: reqId,
                        ip: reqIp,
                        method,
                        error,
                    });
                },
            };
        }
    }
}
