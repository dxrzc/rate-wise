import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { SystemLogger } from './common/logging/system.logger';
import { ServerConfigService } from './config/services/server.config.service';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import hpp from 'hpp';
import { isRecoverableInfraError } from './common/functions/error/is-recoverable-infra-error';

let app: NestExpressApplication | undefined;

function tryToCloseApp(app: INestApplication, context: string) {
    const logger = SystemLogger.getInstance();
    logger.warn('Closing nest application...', context);
    app.close()
        .finally(() => process.exit(1))
        .then(() => {
            logger.warn('Application closed', context);
        })
        .catch((err: Error) => {
            logger.error(`Error closing nest application: ${err.message}`, err.stack, context);
        });
}

process.on('uncaughtException', (error: Error) => {
    SystemLogger.getInstance().error(error.message, error.stack, 'uncaughtException');
    if (isRecoverableInfraError(error) && app) return;
    if (app) {
        tryToCloseApp(app, 'uncaughtException');
        return;
    }
    process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
    const logger = SystemLogger.getInstance();
    if (reason instanceof Error) {
        logger.error(reason.message, reason.stack, 'unhandledRejection');
    } else {
        logger.error(String(reason), 'unhandledRejection');
    }
    if (app) {
        tryToCloseApp(app, 'unhandledRejection');
        return;
    }
    process.exit(1);
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
