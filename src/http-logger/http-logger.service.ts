import { ConsoleLoggerService } from './console.logger.service';
import { HTTP_LOGGER_CONTEXT } from './constants/http-logger.options.constants';
import { FileSystemLoggerService } from './file-system.logger.service';
import { IRequestLog } from './interfaces/request-log.interface';
import { RequestLoggerService } from './request.logger.service';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class HttpLoggerService {
    constructor(
        @Inject(HTTP_LOGGER_CONTEXT) private readonly context: string,
        private readonly consoleLogger: ConsoleLoggerService,
        private readonly fsLogger: FileSystemLoggerService,
        private readonly requestLogger: RequestLoggerService,
    ) {}

    private log(level: string, message: string) {
        this.consoleLogger.log(level, message, this.context);
        this.fsLogger.log(level, message, this.context);
    }

    request(data: IRequestLog) {
        this.requestLogger.log(data);
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
