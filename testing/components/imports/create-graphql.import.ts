import { ApolloDriver } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { handleGqlError } from 'src/common/functions/graphql/handle-gql-error';

export function createGqlImport() {
    return [
        GraphQLModule.forRoot({
            driver: ApolloDriver,
            playground: false,
            introspection: false,
            autoSchemaFile: true,
            formatError: (error) => handleGqlError(error),
            context: (context: { req: Request; res: Response }) => ({
                req: context.req,
                res: context.res,
            }),
        }),
    ];
}
