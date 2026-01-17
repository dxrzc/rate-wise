import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import { ApolloDriverConfig } from '@nestjs/apollo';
import { Injectable } from '@nestjs/common';
import { GqlOptionsFactory } from '@nestjs/graphql';
import { join } from 'path';
import { Code } from 'src/common/enum/code.enum';
import { handleGqlError } from 'src/common/functions/graphql/handle-gql-error';
import { SystemLogger } from 'src/common/logging/system.logger';
import { ServerConfigService } from 'src/config/services/server.config.service';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';

@Injectable()
export class GqlConfigService implements GqlOptionsFactory {
    constructor(
        private readonly serverConfig: ServerConfigService,
        private readonly logger: HttpLoggerService,
    ) {}

    createGqlOptions(): ApolloDriverConfig {
        return {
            playground: false,
            introspection: true,
            csrfPrevention: true,
            plugins: [
                ApolloServerPluginLandingPageLocalDefault({
                    footer: false,
                }),
            ],
            formatError: (error) => {
                const handledError = handleGqlError(error, {
                    stackTrace: this.serverConfig.isDevelopment,
                });
                if (handledError.code === Code.INTERNAL_SERVER_ERROR) {
                    SystemLogger.getInstance().error(error);
                    this.logger.error('Internal server error');
                }
                return handledError;
            },
            autoSchemaFile: join(process.cwd(), 'src/common/graphql/schema.gql'),
            context: (context: { req: Request; res: Response }) => ({
                req: context.req,
                res: context.res,
            }),
        };
    }
}
