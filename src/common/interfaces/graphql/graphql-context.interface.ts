import { RequestContext } from '../../../auth/types/request-context.type';

export interface IGraphQLContext {
    req: RequestContext;
    res: Record<string, any>;
}
