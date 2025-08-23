import { ApolloServerPlugin, GraphQLRequestContext } from '@apollo/server';
import { IGraphQLContext } from 'src/auth/interfaces/graphql-context.interface';
import { Injectable } from '@nestjs/common';
import { ClsService } from 'nestjs-cls';
import { Plugin } from '@nestjs/apollo';
import { v4 as uuidv4 } from 'uuid';

@Plugin()
@Injectable()
export class RequestContextPlugin implements ApolloServerPlugin {
    constructor(private readonly cls: ClsService) {}

    // eslint-disable-next-line @typescript-eslint/require-await
    async requestDidStart(
        requestContext: GraphQLRequestContext<IGraphQLContext>,
    ) {
        const request = requestContext.contextValue.req;
        const method = requestContext.request.operationName;
        const reqIp = request.ip;
        const reqId = uuidv4();

        this.cls.set('ip', reqIp);
        this.cls.set('requestId', reqId);
        this.cls.set('method', method);
    }
}
