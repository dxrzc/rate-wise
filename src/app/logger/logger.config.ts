import { ServerConfigService } from 'src/config/services/server-config.service';
import { consoleTransportFactory } from './transports/console-transport.factory';
import { fileSystemTransportFactory } from './transports/fs-transport.factory';
import { Injectable } from '@nestjs/common';
import {
    WinstonModuleOptions,
    WinstonModuleOptionsFactory,
} from 'nest-winston';

@Injectable()
export class WinstonConfigService implements WinstonModuleOptionsFactory {
    constructor(private readonly serverConfig: ServerConfigService) {}

    createWinstonModuleOptions(): WinstonModuleOptions {
        const environment = this.serverConfig.environment;
        return {
            transports: [
                consoleTransportFactory(environment),
                fileSystemTransportFactory(environment),
            ],
        };
    }
}
