import { consoleTransportFactory } from './transports/console.transport.factory';
import { fileSystemTransportFactory } from './transports/fs.transport.factory';
import { reqFsTransportFactory } from './transports/req-fs.transport.factory';
import { IRequestLog } from './interfaces/request-log.interface';
import { Inject, Injectable } from '@nestjs/common';
import * as winston from 'winston';
import { LOGGING_OPTIONS } from '../constants/logging.options.constants';
import { ILoggingOptions } from '../interfaces/logging.options.interface';

@Injectable()
export class HttpLoggerService {
    private consoleLogger: winston.Logger;
    private reqLogger: winston.Logger;
    private fsLogger: winston.Logger;

    constructor(@Inject(LOGGING_OPTIONS) loggingOptions: ILoggingOptions) {
        const mssgConsole = consoleTransportFactory(
            loggingOptions.messages.console,
        );
        this.consoleLogger = winston.createLogger({
            transports: [mssgConsole],
        });

        const mssgFs = fileSystemTransportFactory(
            loggingOptions.messages.filesystem,
        );
        this.fsLogger = winston.createLogger({
            transports: [mssgFs],
        });

        const reqFs = reqFsTransportFactory(loggingOptions.requests);
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
