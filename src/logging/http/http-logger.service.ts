import { consoleTransportFactory } from './transports/console.transport.factory';
import { ServerConfigService } from 'src/config/services/server-config.service';
import { fileSystemTransportFactory } from './transports/fs.transport.factory';
import { Injectable } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class HttpLoggerService {
    private consoleLogger: winston.Logger;
    private fsLogger: winston.Logger;

    constructor(private readonly serverConfig: ServerConfigService) {
        const console = consoleTransportFactory(this.serverConfig.environment);
        this.consoleLogger = winston.createLogger({
            transports: [console],
        });

        const fs = fileSystemTransportFactory(this.serverConfig.environment);
        this.fsLogger = winston.createLogger({
            transports: [fs],
        });
    }

    private log(level: string, message: string) {
        this.consoleLogger.log(level, message);
        this.fsLogger.log(level, message);
    }

    info(message: string) {
        this.log('info', message);
    }

    error(message: string) {
        this.log('error', message);
    }

    debug(message: string) {
        this.log('debug', message);
    }

    warn(message: string) {
        this.log('warn', message);
    }
}
