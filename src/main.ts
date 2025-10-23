import { ServerConfigService } from './config/services/server.config.service';
import { AppModule } from './app/app.module';
import { NestFactory } from '@nestjs/core';
import { SystemLoggerService } from './system-logger/system-logger.service';

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        bufferLogs: true,
    });
    const systemLogger = app.get(SystemLoggerService);
    app.useLogger(systemLogger);

    app.enableShutdownHooks();
    const serverConfig = app.get(ServerConfigService);
    await app.listen(serverConfig.port);
    systemLogger.log(`Running in ${serverConfig.env} mode`, 'Bootstrap');
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
