import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';
import { ValidationPipe } from '@nestjs/common';
import { ServerConfigService } from './config/services/server-config.service';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const serverConfig = app.get(ServerConfigService);
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
        }),
    );
    await app.listen(serverConfig.port);

    // TODO: NestJS logger
    console.log(`Running in ${serverConfig.environment.toUpperCase()} mode`);

    // process.env.NEST_DEBUG = 'true';
    // TODO: cleaning, read: https://docs.nestjs.com/fundamentals/lifecycle-events#application-shutdown
    // if (process.env.NODE_ENV === 'development') app.enableShutdownHooks();
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
