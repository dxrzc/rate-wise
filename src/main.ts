import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { SystemLogger } from './common/logging/system.logger';
import { ServerConfigService } from './config/services/server.config.service';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import hpp from 'hpp';
import { handleFatalError } from './common/errors/handle-fatal-error';

let app: NestExpressApplication | undefined;

process.on('uncaughtException', (error: Error) => {
    handleFatalError('uncaughtException', error, app);
});

process.on('unhandledRejection', (reason: unknown) => {
    handleFatalError('unhandledRejection', reason, app);
});

async function bootstrap() {
    app = await NestFactory.create<NestExpressApplication>(AppModule, {
        bufferLogs: true,
    });
    const serverConfig = app.get(ServerConfigService);
    // There is a problem with Apollo Sandbox and helmet
    // That's why this configuration is required. https://docs.nestjs.com/security/helmet#use-with-express-default
    app.use(
        helmet({
            crossOriginEmbedderPolicy: false,
            contentSecurityPolicy: {
                directives: {
                    imgSrc: [`'self'`, 'data:', 'apollo-server-landing-page.cdn.apollographql.com'],
                    scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
                    manifestSrc: [`'self'`, 'apollo-server-landing-page.cdn.apollographql.com'],
                    frameSrc: [`'self'`, 'sandbox.embed.apollographql.com'],
                },
            },
        }),
    );
    app.use(hpp());
    app.set('trust proxy', serverConfig.trustProxy);
    app.useLogger(SystemLogger.getInstance());
    app.enableShutdownHooks();

    await app.listen(serverConfig.port);
    SystemLogger.getInstance().log(
        `Running in ${serverConfig.env} mode on port ${serverConfig.port}`,
        'NestApplication',
    );
    if (serverConfig.isDevelopment) {
        SystemLogger.getInstance().verbose(
            `Try it! http://localhost:${process.env.SERVER_PORT}/graphql`,
            'NestApplication',
        );
    }
}

bootstrap().catch((error) => {
    throw error;
});
