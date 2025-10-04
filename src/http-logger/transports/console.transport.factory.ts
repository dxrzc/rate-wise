import { ClsServiceManager } from 'nestjs-cls';
import * as winston from 'winston';
import { HttpConsoleLogOptions } from '../types/log.type';

export function consoleTransportFactory(options: HttpConsoleLogOptions) {
    return new winston.transports.Console({
        silent: options.silent,
        level: options.minLevel,
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            winston.format.printf((info) => {
                const colorizer = winston.format.colorize().colorize;
                const cls = ClsServiceManager.getClsService();
                const requestId = cls.get<string>('requestId');
                const method = cls.get<string>('method');
                const timestamp = <string>info.timestamp;
                const mssg = <string>info.message;
                const level = info.level;
                const ms = <string>info.ms;

                const colorizedMs = colorizer('verbose', ms);
                const coloredTimestamp = colorizer(level, `[${timestamp}]`);
                const coloredRequest = colorizer(level, `[${requestId}]`);
                const coloredMethod = colorizer(level, `[${method}]`);
                const formattedMssg = mssg[0].toUpperCase() + mssg.slice(1);
                const coloredLevel = colorizer(
                    level,
                    `[${level.toUpperCase()}]`,
                );

                return `${coloredTimestamp} ${coloredRequest} ${coloredMethod} ${coloredLevel}: ${formattedMssg} ${colorizedMs}`;
            }),
        ),
    });
}
