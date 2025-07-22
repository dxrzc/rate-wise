import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

let app: INestApplication<any>;

// eslint-disable-next-line @typescript-eslint/no-misused-promises
process.on('SIGINT', async () => {
    await app.close();
    console.log('Closing application (SIGINT)');
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
process.on('SIGTERM', async () => {
    await app.close();
    console.log('Closing application (SIGTERM)');
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
process.on('unhandledException', async () => {
    await app.close();
    console.log('Closing application due unhandledException');
});

// eslint-disable-next-line @typescript-eslint/no-misused-promises
process.on('unhandledRejection', async () => {
    await app.close();
    console.log('Closing application due unhandledRejection');
});

async function bootstrap() {
    process.env.NEST_DEBUG = 'true';
    app = await NestFactory.create(AppModule);
    await app.listen(process.env.PORT ?? 3000);
}

// eslint-disable-next-line @typescript-eslint/no-floating-promises
bootstrap();
