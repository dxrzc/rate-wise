import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';

export function consoleTransportFactory() {
    return new winston.transports.Console({
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            nestWinstonModuleUtilities.format.nestLike('RateWise', {
                colors: true,
                prettyPrint: true,
                processId: true,
                appName: true,
            }),
        ),
    });
}
