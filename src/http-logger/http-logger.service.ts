import {
    HTTP_LOGGER_CONTEXT,
    HTTP_LOGGER_OPTIONS,
} from './constants/http-logger.options.constants';
import { IHttpLoggerOptions } from './interfaces/http-logger.options.interface';
import { IRequestLog } from './interfaces/request-log.interface';
import { consoleTransportFactory } from './transports/console.transport.factory';
import { fileSystemTransportFactory } from './transports/fs.transport.factory';
import { reqFsTransportFactory } from './transports/req-fs.transport.factory';
import { Inject, Injectable } from '@nestjs/common';
import * as winston from 'winston';

@Injectable()
export class HttpLoggerService {
    private consoleLogger: winston.Logger;
    private reqLogger: winston.Logger;
    private fsLogger: winston.Logger;

    constructor(
        @Inject(HTTP_LOGGER_OPTIONS)
        private readonly loggerOptions: IHttpLoggerOptions,
        @Inject(HTTP_LOGGER_CONTEXT) private readonly context: string,
    ) {
        if (loggerOptions.silentAll) {
            loggerOptions.messages.console.silent = true;
            loggerOptions.messages.filesystem.silent = true;
            loggerOptions.requests.silent = true;
        }

        const mssgConsole = consoleTransportFactory(
            loggerOptions.messages.console,
            context,
        );
        this.consoleLogger = winston.createLogger({
            transports: [mssgConsole],
        });

        const mssgFs = fileSystemTransportFactory(
            loggerOptions.messages.filesystem,
            context,
        );
        this.fsLogger = winston.createLogger({
            transports: [mssgFs],
        });

        const reqFs = reqFsTransportFactory(loggerOptions.requests);
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
