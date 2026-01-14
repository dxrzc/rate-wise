import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import * as winston from 'winston';
import { ClsServiceManager } from 'nestjs-cls';
import { IHttpLoggerRootOptions } from '../interfaces/http-logger.root.options.interface';
import { HTTP_LOGGER_ROOT_OPTIONS } from '../constants/http-logger.options.constants';
import { createDummyTransport } from '../functions/create-dummy-transport';

// Messages in filesystem
@Injectable()
export class FileSystemLoggerService {
    private fsLogger: winston.Logger;

    constructor(
        @Inject(HTTP_LOGGER_ROOT_OPTIONS)
        private readonly options: IHttpLoggerRootOptions,
    ) {
        const fsOptions = options.messages.filesystem;
        const transport =
            options.silentAll || fsOptions.silent
                ? createDummyTransport()
                : new winston.transports.File({
                      silent: fsOptions.silent,
                      level: fsOptions.minLevel,
                      filename: `${fsOptions.dir}/${fsOptions.filename}`,
                      format: winston.format.combine(
                          winston.format.timestamp(),
                          winston.format.printf((info: winston.Logform.TransformableInfo) => {
                              const context = <string>info.context;
                              const cls = ClsServiceManager.getClsService();
                              const reqId = cls.get<string>('requestId');
                              const ip = cls.get<string>('ip');
                              return JSON.stringify({
                                  timestamp: <string>info.timestamp,
                                  level: info.level,
                                  message: info.message,
                                  requestId: reqId,
                                  ip: ip,
                                  context,
                              });
                          }),
                      ),
                  });

        this.fsLogger = winston.createLogger({
            transports: [transport],
        });
    }

    log(level: string, message: string, context: string) {
        this.fsLogger.log(level, message, { context });
    }
}
