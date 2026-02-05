import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloDriverConfig } from '@nestjs/apollo';
import { Injectable } from '@nestjs/common';
import { GqlOptionsFactory } from '@nestjs/graphql';
import { join } from 'path';
import { handleGqlError } from 'src/common/graphql/handle-gql-error';
import { ServerConfigService } from 'src/config/services/server.config.service';
import depthLimit from 'graphql-depth-limit';
import { GRAPHQL_CONSTANTS } from 'src/common/graphql/graphql.rules';

@Injectable()
export class GqlConfigService implements GqlOptionsFactory {
    constructor(private readonly serverConfig: ServerConfigService) {}

    createGqlOptions(): ApolloDriverConfig {
        return {
            playground: false,
            introspection: true,
            csrfPrevention: true,
            validationRules: [depthLimit(GRAPHQL_CONSTANTS.depthLimit)],
            plugins: [
                ApolloServerPluginLandingPageLocalDefault({
                    footer: false,
                }),
            ],
            formatError: (error) => {
                return handleGqlError(error, {
                    stackTrace: this.serverConfig.isDevelopment,
                });
            },
            autoSchemaFile: join(process.cwd(), 'src/common/graphql/schema.gql'),
            context: (context: { req: Request; res: Response }) => ({
                req: context.req,
                res: context.res,
            }),
        };
    }
}
