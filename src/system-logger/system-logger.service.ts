import { ConsoleLogger, Inject, Injectable } from '@nestjs/common';
import * as winston from 'winston';
import { SYSTEM_LOGGER_OPTIONS } from './constants/system-logger.constants';
import { ISystemLoggerOptions } from './interfaces/system-logger.options.interface';

@Injectable()
export class SystemLoggerService extends ConsoleLogger {
    private readonly fsLogger: winston.Logger;
    constructor(
        @Inject(SYSTEM_LOGGER_OPTIONS)
        private readonly loggingOpts: ISystemLoggerOptions,
    ) {
        super();
        this.fsLogger = winston.createLogger({
            transports: [
                loggingOpts.silent
                    ? new winston.transports.Console({ silent: true })
                    : new winston.transports.File({
                          filename: `${this.loggingOpts.dir}/${this.loggingOpts.filename}`,
                          format: winston.format.combine(
                              winston.format.timestamp(),
                          ),
                      }),
            ],
        });
    }

    error(...args: Parameters<ConsoleLogger['error']>) {
        const [message, stack] = args as string[];
        this.fsLogger.log({
            level: 'error',
            message,
            stack,
        });
        super.error(...args);
    }

    warn(...args: Parameters<ConsoleLogger['warn']>) {
        const [message] = args as string[];
        this.fsLogger.warn(message);
        super.error(...args);
    }
}
