import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import * as winston from 'winston';
import { HTTP_LOGGER_ROOT_OPTIONS } from '../constants/http-logger.options.constants';
import { IHttpLoggerRootOptions } from '../interfaces/http-logger.root.options.interface';
import { createDummyTransport } from '../functions/create-dummy-transport';
import {
    IRestRequestLog,
    IGqlRequestLog,
} from '../interfaces/request-log.interface';

// Request logs fs
@Injectable()
export class RequestLoggerService {
    private requestLogger: winston.Logger;

    constructor(
        @Inject(HTTP_LOGGER_ROOT_OPTIONS)
        private readonly options: IHttpLoggerRootOptions,
    ) {
        const reqLoggingOpts = options.requests;
        const transport =
            reqLoggingOpts.silent || options.silentAll
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

    // gql
    logGQL(data: IGqlRequestLog) {
        this.requestLogger.log('info', data);
    }

    // REST
    logREST(data: IRestRequestLog) {
        this.requestLogger.log('info', data);
    }
}
