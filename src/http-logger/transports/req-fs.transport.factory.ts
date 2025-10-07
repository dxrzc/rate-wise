import * as winston from 'winston';
import { HttpRequestLogOptions } from '../types/log.type';

export function reqFsTransportFactory(options: HttpRequestLogOptions) {
    if (options.silent) return new winston.transports.Console({ silent: true });
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
