import {
    Injectable,
    NestInterceptor,
    ExecutionContext,
    CallHandler,
} from '@nestjs/common';
import { IGraphQLContext } from 'src/auth/interfaces/graphql-context.interface';
import { GqlExecutionContext } from '@nestjs/graphql';
import { ClsService } from 'nestjs-cls';
import { v4 as uuidv4 } from 'uuid';
import { Observable } from 'rxjs';

@Injectable()
export class RequestTracingInterceptor implements NestInterceptor {
    constructor(private readonly cls: ClsService) {}

    intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
        const graphQLContext = GqlExecutionContext.create(context);
        const reqContext = graphQLContext.getContext<IGraphQLContext>();
        const userIp = reqContext.req.ip;
        const reqId = uuidv4();
        this.cls.set('ip', userIp);
        this.cls.set('requestId', reqId);
        this.cls.set('method', graphQLContext.getHandler().name);
        return next.handle();
    }
}
