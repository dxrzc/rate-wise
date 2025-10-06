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
        if (reqCtx.request.operationName! !== 'IntrospectionQuery') {
            const request = reqCtx.contextValue.req;
            const now = Date.now();
            const reqIp = request.ip!;
            const reqId = uuidv4();
            const query = reqCtx.request.query!;
            const variables = reqCtx.request.variables;

            // Used in future logs
            this.cls.set('ip', reqIp);
            this.cls.set('requestId', reqId);

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
                        query,
                        variables,
                        ip: reqIp,
                        error,
                    });
                },
            };
        }
    }
}
