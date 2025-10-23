import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ServerConfigService } from 'src/config/services/server.config.service';
import { INTERNAL_SERVER_ERROR } from 'src/common/constants/errors.constants';
import { Environment } from 'src/common/enum/environment.enum';
import { ApolloDriverConfig } from '@nestjs/apollo';
import { GqlOptionsFactory } from '@nestjs/graphql';
import { Injectable } from '@nestjs/common';
import { join } from 'path';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';

@Injectable()
export class GqlConfigService implements GqlOptionsFactory {
    constructor(
        private readonly serverConfig: ServerConfigService,
        private readonly httpLogger: HttpLoggerService,
    ) {}

    createGqlOptions(): ApolloDriverConfig {
        const environment = this.serverConfig.env;

        return {
            playground: false,
            plugins: this.serverConfig.isDevelopment
                ? [ApolloServerPluginLandingPageLocalDefault()]
                : [],
            formatError: (error) => {
                const code = error.extensions?.code || 'INTERNAL_SERVER_ERROR';
                const dev = environment === Environment.DEVELOPMENT;
                const stackTrace = dev
                    ? error.extensions?.stacktrace
                    : undefined;

                if (code === 'INTERNAL_SERVER_ERROR') {
                    this.httpLogger.error('Internal server error');
                    return {
                        // suppress raw server errors
                        message: INTERNAL_SERVER_ERROR,
                        code,
                        stackTrace,
                    };
                }

                return {
                    message: error.message,
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
