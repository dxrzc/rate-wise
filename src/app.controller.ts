import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ServerConfigService } from './config/services/server.config.service';

@Controller()
export class AppController {
    constructor(
        private readonly appService: AppService,
        private readonly serverConfigService: ServerConfigService,
    ) {}

    @Get()
    getHello(): number {
        return this.serverConfigService.port;
    }
}
