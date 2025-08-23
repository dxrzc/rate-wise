import { Environment } from 'src/common/enum/environment.enum';
import * as winston from 'winston';

export function reqFsTransportFactory(env: Environment) {
    const devFolder = 'logs/dev';
    const prodFolder = 'logs/prod';
    const folder = env === Environment.PRODUCTION ? prodFolder : devFolder;
    return new winston.transports.File({
        silent: env === Environment.INTEGRATION,
        filename: `${folder}/request.log`,
        level: 'info',
        format: winston.format.combine(
            winston.format.timestamp(),
            // skipping level
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            winston.format.printf(({ level, timestamp, message, ...meta }) => {
                return JSON.stringify({ timestamp, message, ...meta });
            }),
        ),
    });
}
