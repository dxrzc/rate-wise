import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import { HTTP_LOGGER_OPTIONS } from './constants/http-logger.options.constants';
import { IHttpLoggerOptions } from './interfaces/http-logger.options.interface';
import * as winston from 'winston';
import { createDummyTransport } from './functions/create-dummy-transport';
import { IRequestLog } from './interfaces/request-log.interface';

// Request logs fs
@Injectable()
export class RequestLoggerService {
    private requestLogger: winston.Logger;

    constructor(
        @Inject(HTTP_LOGGER_OPTIONS)
        private readonly loggerOptions: IHttpLoggerOptions,
    ) {
        const reqLoggingOpts = loggerOptions.requests;
        const transport =
            reqLoggingOpts.silent || loggerOptions.silentAll
                ? createDummyTransport()
                : new winston.transports.File({
                      filename: `${reqLoggingOpts.dir}/${reqLoggingOpts.filename}`,
                      level: 'info',
                      format: winston.format.combine(
                          winston.format.timestamp(),
                          winston.format.printf(
                              // skipping level
                              // eslint-disable-next-line @typescript-eslint/no-unused-vars
                              ({ level, timestamp, message, ...meta }) => {
                                  return JSON.stringify({
                                      timestamp,
                                      message,
                                      ...meta,
                                  });
                              },
                          ),
                      ),
                  });

        this.requestLogger = winston.createLogger({
            transports: [transport],
        });
    }

    log(data: IRequestLog) {
        this.requestLogger.log('info', data);
    }
}
