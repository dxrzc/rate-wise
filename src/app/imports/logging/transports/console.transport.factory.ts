import { ClsServiceManager } from 'nestjs-cls';
import { Environment } from 'src/common/enum/environment.enum';
import * as winston from 'winston';

export function consoleTransportFactory(env: Environment) {
    return new winston.transports.Console({
        silent: env === Environment.INTEGRATION,
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.printf((info) => {
                const colorizer = winston.format.colorize().colorize;
                const cls = ClsServiceManager.getClsService();
                const requestId = cls.get<string>('requestId');
                const method = cls.get<string>('method');
                const timestamp = <string>info.timestamp;
                const mssg = <string>info.message;
                const level = info.level;

                const coloredTimestamp = colorizer(level, `[${timestamp}]`);
                const coloredRequest = colorizer(level, `[${requestId}]`);
                const coloredMethod = colorizer(level, `[${method}]`);
                const formattedMssg = mssg[0].toUpperCase() + mssg.slice(1);
                const coloredLevel = colorizer(
                    level,
                    `[${level.toUpperCase()}]`,
                );

                return `${coloredTimestamp} ${coloredRequest} ${coloredMethod} ${coloredLevel}: ${formattedMssg}`;
            }),
        ),
    });
}
