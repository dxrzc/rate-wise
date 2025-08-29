import { ServerConfigService } from './config/services/server.config.service';
import { AppModule } from './app/app.module';
import { NestFactory } from '@nestjs/core';

async function bootstrap() {
    // TODO: replace logger in bootstraping
    const app = await NestFactory.create(AppModule);
    const serverConfig = app.get(ServerConfigService);
    await app.listen(serverConfig.port);
    // TODO: NestJS logger
    console.log(`Running in ${serverConfig.env.toUpperCase()} mode`);

    // process.env.NEST_DEBUG = 'true';
    // TODO: cleaning, read: https://docs.nestjs.com/fundamentals/lifecycle-events#application-shutdown
    // if (process.env.NODE_ENV === 'development') app.enableShutdownHooks();
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
