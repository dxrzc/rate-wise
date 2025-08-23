import { consoleTransportFactory } from './transports/console.transport.factory';
import { ServerConfigService } from 'src/config/services/server-config.service';
import { fileSystemTransportFactory } from './transports/fs.transport.factory';
import { reqFsTransportFactory } from './transports/req-fs.transport.factory';
import { IRequestLog } from './interfaces/request-log.interface';
import { Injectable } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class HttpLoggerService {
    private consoleLogger: winston.Logger;
    private reqLogger: winston.Logger;
    private fsLogger: winston.Logger;

    constructor(private readonly serverConfig: ServerConfigService) {
        const env = this.serverConfig.environment;

        const mssgConsole = consoleTransportFactory(env);
        this.consoleLogger = winston.createLogger({
            transports: [mssgConsole],
        });

        const mssgFs = fileSystemTransportFactory(env);
        this.fsLogger = winston.createLogger({
            transports: [mssgFs],
        });

        const reqFs = reqFsTransportFactory(env);
        this.reqLogger = winston.createLogger({
            transports: [reqFs],
        });
    }

    private log(level: string, message: string) {
        this.consoleLogger.log(level, message);
        this.fsLogger.log(level, message);
    }

    request(data: IRequestLog) {
        this.reqLogger.log('info', data);
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
