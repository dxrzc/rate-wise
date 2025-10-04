import { RequestLogOptions } from 'src/logging/types/log.type';
import * as winston from 'winston';

export function reqFsTransportFactory(options: RequestLogOptions) {
    return new winston.transports.File({
        silent: options.silent,
        filename: `${options.dir}/${options.filename}`,
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
