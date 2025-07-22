import { Module } from '@nestjs/common';
import { AppService } from './app.service';
import { AppController } from './app.controller';
import { AppConfigModule } from './config/app-config.module';

@Module({
    imports: [AppConfigModule],
    controllers: [AppController],
    providers: [AppService],
})
export class AppModule {}
