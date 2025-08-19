import { Environment } from 'src/common/enum/environment.enum';
import * as winston from 'winston';

export function fileSystemTransportFactory(env: Environment) {
    const devFolder = 'logs/dev';
    const prodFolder = 'logs/prod';
    const folder = env === Environment.PRODUCTION ? prodFolder : devFolder;

    return new winston.transports.File({
        silent: env === Environment.INTEGRATION,
        level: 'info', // No debug messages in fs
        filename: `${folder}/http-messages.log`,
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.prettyPrint(),
        ),
    });
}
