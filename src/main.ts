import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { SystemLogger } from './common/logging/system.logger';
import { ServerConfigService } from './config/services/server.config.service';

let app: INestApplication | undefined;

function tryToCloseApp(app: INestApplication) {
    app.close()
        .finally(() => process.exit(1))
        .catch((err: Error) => {
            SystemLogger.getInstance().error(
                `Error closing nest application: ${err.message}`,
                err.stack,
            );
        });
}

process.on('uncaughtException', ({ message, stack }: Error) => {
    SystemLogger.getInstance().error(`uncaughtException: ${message}`, stack);
    if (app) {
        tryToCloseApp(app);
        return;
    }
    process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
    const logger = SystemLogger.getInstance();
    if (reason instanceof Error) {
        logger.error(`unhandledRejection: ${reason.message}`, reason.stack);
    } else {
        logger.error(`unhandledRejection: ${String(reason)}`);
    }
    if (app) {
        tryToCloseApp(app);
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
        'Bootstrap',
    );
}

bootstrap().catch((error) => {
    throw error;
});
