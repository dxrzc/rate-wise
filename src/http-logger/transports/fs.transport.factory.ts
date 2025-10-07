import { ClsServiceManager } from 'nestjs-cls';
import * as winston from 'winston';
import { HttpFileSystemLogOptions } from '../types/log.type';

export function fileSystemTransportFactory(options: HttpFileSystemLogOptions) {
    if (options.silent) return new winston.transports.Console({ silent: true });
    return new winston.transports.File({
        silent: options.silent,
        level: options.minLevel,
        filename: `${options.dir}/${options.filename}`,
        format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.printf((info) => {
                const cls = ClsServiceManager.getClsService();
                const reqId = cls.get<string>('requestId');
                const ip = cls.get<string>('ip');
                return JSON.stringify({
                    timestamp: info.timestamp,
                    level: info.level,
                    message: info.message,
                    context: info.context,
                    requestId: reqId,
                    ip: ip,
                });
            }),
        ),
    });
}
