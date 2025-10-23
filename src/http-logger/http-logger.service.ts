import { HTTP_LOGGER_FEATURE_OPTIONS } from './constants/http-logger.options.constants';
import { IRequestLog } from './interfaces/request-log.interface';
import { Inject, Injectable } from '@nestjs/common';
import { ConsoleLoggerService } from './services/console.logger.service';
import { FileSystemLoggerService } from './services/file-system.logger.service';
import { RequestLoggerService } from './services/request.logger.service';
import { IHttpLoggerFeatureOptions } from './interfaces/http-logger.feature.options.interface';

@Injectable()
export class HttpLoggerService {
    constructor(
        @Inject(HTTP_LOGGER_FEATURE_OPTIONS)
        private readonly options: IHttpLoggerFeatureOptions,
        private readonly consoleLogger: ConsoleLoggerService,
        private readonly fsLogger: FileSystemLoggerService,
        private readonly requestLogger: RequestLoggerService,
    ) {}

    private log(level: string, message: string) {
        this.consoleLogger.log(level, message, this.options.context);
        this.fsLogger.log(level, message, this.options.context);
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
