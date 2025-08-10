export interface IGraphQLContext {
    req: Request & { session: { userId: string } };
}
