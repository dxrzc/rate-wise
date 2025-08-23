import { Environment } from 'src/common/enum/environment.enum';
import { ClsServiceManager } from 'nestjs-cls';
import * as winston from 'winston';

export function fileSystemTransportFactory(env: Environment) {
    const devFolder = 'logs/dev';
    const prodFolder = 'logs/prod';
    const folder = env === Environment.PRODUCTION ? prodFolder : devFolder;
    return new winston.transports.File({
        silent: env === Environment.INTEGRATION,
        level: 'info', // No debug messages in fs
        filename: `${folder}/messages.log`,
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
