import { Inject, Injectable } from '@nestjs/common';
import * as winston from 'winston';
import { SYSTEM_LOGGER_OPTIONS } from './constants/system-logger.constants';
import { ISystemLoggerOptions } from './interfaces/system-logger.options.interface';

type LogInfo = winston.Logform.TransformableInfo & {
    [prop: string]: any;
};

@Injectable()
export class SystemLoggerService {
    private readonly logger: winston.Logger;
    constructor(
        @Inject(SYSTEM_LOGGER_OPTIONS)
        private readonly options: ISystemLoggerOptions,
    ) {
        this.logger = winston.createLogger({
            transports: [
                new winston.transports.Console({
                    silent: options.silent,
                    format: winston.format.combine(
                        winston.format.timestamp(),
                        winston.format.printf((logInfo: LogInfo) => {
                            const colorizer =
                                winston.format.colorize().colorize;
                            const coloredLevel = colorizer(
                                logInfo.level,
                                `[${logInfo.level.toUpperCase()}]`,
                            );
                            const coloredTimestamp = colorizer(
                                logInfo.level,
                                `[${logInfo.timestamp}]`,
                            );
                            const coloredMessage = colorizer(
                                logInfo.level,
                                <string>logInfo.message,
                            );
                            if (logInfo.stackTrace)
                                return `${coloredTimestamp} ${coloredLevel}: ${coloredMessage} ${logInfo.stackTrace}`;
                            return `${coloredTimestamp} ${coloredLevel}: ${coloredMessage}`;
                        }),
                    ),
                }),
                options.silent
                    ? new winston.transports.Console({ silent: true })
                    : new winston.transports.File({
                          filename: `${this.options.dir}/${this.options.filename}`,
                          format: winston.format.combine(
                              winston.format.timestamp(),
                          ),
                      }),
            ],
        });
    }

    info(message: string) {
        this.logger.info(message);
    }

    error(message: string, stackTrace?: string) {
        try {
            this.logger.log({
                level: 'error',
                message,
                stackTrace,
            });
        } catch (error) {
            console.error(error);
        }
    }

    warn(message: string) {
        this.logger.warn(message);
    }
}
