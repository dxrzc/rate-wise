import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import { Environment } from 'src/common/enum/environment.enum';
import * as winston from 'winston';

export function consoleTransportFactory(env: Environment) {
    return new winston.transports.Console({
        silent: env === Environment.INTEGRATION,
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
