import { ApolloDriver } from '@nestjs/apollo';
import { GraphQLModule } from '@nestjs/graphql';
import { GraphQLFormattedError } from 'graphql';
import { handleGqlError } from 'src/common/graphql/handle-gql-error';

export function createGqlImport(customDataGetter?: () => object) {
    return [
        GraphQLModule.forRoot({
            driver: ApolloDriver,
            playground: false,
            introspection: false,
            autoSchemaFile: true,
            formatError: (error: GraphQLFormattedError) => handleGqlError(error),
            context: (context: { req: Request; res: Response }) => {
                const req = context.req;
                if (customDataGetter) {
                    const currentData = customDataGetter();
                    Object.assign(req, currentData);
                }
                return {
                    res: context.res,
                    req,
                };
            },
        }),
    ];
}
