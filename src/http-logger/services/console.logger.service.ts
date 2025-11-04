import { Injectable } from '@nestjs/common';
import { Inject } from '@nestjs/common';
import * as winston from 'winston';
import { ClsServiceManager } from 'nestjs-cls';
import { IHttpLoggerRootOptions } from '../interfaces/http-logger.root.options.interface';
import { HTTP_LOGGER_ROOT_OPTIONS } from '../constants/http-logger.options.constants';
import { InfoType } from '../types/info.type';

// Messages in console
@Injectable()
export class ConsoleLoggerService {
    private consoleLogger: winston.Logger;

    constructor(
        @Inject(HTTP_LOGGER_ROOT_OPTIONS)
        private readonly options: IHttpLoggerRootOptions,
    ) {
        const consoleOptions = this.options.messages.console;
        const transport = new winston.transports.Console({
            silent: options.silentAll || consoleOptions.silent,
            level: consoleOptions.minLevel,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.ms(),
                winston.format.printf((info: InfoType) => {
                    const colorizer = winston.format.colorize().colorize;
                    const cls = ClsServiceManager.getClsService();
                    const requestId = cls.get<string>('requestId');
                    const timestamp = <string>info.timestamp;
                    const mssg = <string>info.message;
                    const level = info.level;
                    const ms = <string>info.ms;

                    const colorizedMs = colorizer('verbose', ms);
                    const coloredTimestamp = colorizer(level, `[${timestamp}]`);
                    const coloredRequest = colorizer(level, `[${requestId}]`);
                    const formattedMssg = mssg[0].toUpperCase() + mssg.slice(1);
                    const coloredContext = colorizer(level, `[${info.context}]`);
                    const coloredLevel = colorizer(level, `[${level.toUpperCase()}]`);

                    return `${coloredTimestamp} ${coloredRequest} ${coloredLevel} ${coloredContext}: ${formattedMssg} ${colorizedMs}`;
                }),
            ),
        });

        this.consoleLogger = winston.createLogger({
            transports: [transport],
        });
    }

    log(level: string, message: string, context: string) {
        this.consoleLogger.log(level, message, { context });
    }
}
