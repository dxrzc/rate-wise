import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ServerConfigService } from 'src/config/services/server.config.service';
import { INTERNAL_SERVER_ERROR } from 'src/common/constants/errors.constants';
import { Environment } from 'src/common/enum/environment.enum';
import { ApolloDriverConfig } from '@nestjs/apollo';
import { GqlOptionsFactory } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { join } from 'path';

// TODO: add system logging for internal server errors

@Injectable()
export class GqlConfigService implements GqlOptionsFactory {
    constructor(private readonly serverConfig: ServerConfigService) {}

    createGqlOptions(): ApolloDriverConfig {
        const environment = this.serverConfig.env;

        return {
            playground: false,
            plugins: [ApolloServerPluginLandingPageLocalDefault()],
            formatError: (error) => {
                const code = error.extensions?.code || 'INTERNAL_SERVER_ERROR';
                const dev = environment === Environment.DEVELOPMENT;
                const stackTrace = dev
                    ? error.extensions?.stacktrace
                    : undefined;

                if (code !== 'INTERNAL_SERVER_ERROR') {
                    return {
                        message: error.message,
                        code,
                        stackTrace,
                    };
                }

                return {
                    message: INTERNAL_SERVER_ERROR, // suppress raw server errors
                    code,
                    stackTrace,
                };
            },
            autoSchemaFile: join(
                process.cwd(),
                'src/common/graphql/schema.gql',
            ),
            context: (context: { req: Request; res: Response }) => ({
                req: context.req,
                res: context.res,
            }),
        };
    }
}
