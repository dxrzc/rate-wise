import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { SystemLogger } from './common/logging/system.logger';
import { ServerConfigService } from './config/services/server.config.service';

let app: INestApplication | undefined;

function tryToCloseApp(app: INestApplication, context: string) {
    const logger = SystemLogger.getInstance();
    logger.warn('Closing nest application...', context);
    app.close()
        .finally(() => process.exit(1))
        .then(() => {
            logger.warn('Application closed', context);
        })
        .catch((err: Error) => {
            logger.error(
                `Error closing nest application: ${err.message}`,
                err.stack,
                context,
            );
        });
}

process.on('uncaughtException', ({ message, stack }: Error) => {
    SystemLogger.getInstance().error(message, stack, 'uncaughtException');
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
    app = await NestFactory.create(AppModule, {
        bufferLogs: true,
    });
    app.useLogger(SystemLogger.getInstance());
    app.enableShutdownHooks();

    const serverConfig = app.get(ServerConfigService);
    await app.listen(serverConfig.port);
    SystemLogger.getInstance().log(
        `Running in ${serverConfig.env} mode`,
        'NestApplication',
    );
}

bootstrap().catch((error) => {
    throw error;
});
