import { Injectable } from '@nestjs/common';
import { ServerConfigService } from 'src/config/services/server.config.service';
import { IHttpLoggerOptionsFactory } from 'src/http-logger/config/http-logger-factory.options';
import { IHttpLoggerRootOptions } from 'src/http-logger/config/http-logger-root.options';

@Injectable()
export class HttpLoggerConfigService implements IHttpLoggerOptionsFactory {
    constructor(private readonly serverConfig: ServerConfigService) {}

    create(): IHttpLoggerRootOptions {
        const logsDir = this.serverConfig.isProduction ? 'logs/prod' : 'logs/dev';
        return {
            silentAll: this.serverConfig.isTesting,
            requests: {
                dir: logsDir,
                filename: 'request.log',
            },
            messages: {
                filesystem: {
                    filename: 'messages.log',
                    minLevel: 'info',
                    dir: logsDir,
                },
                console: {
                    minLevel: this.serverConfig.isDevelopment ? 'debug' : 'info',
                },
            },
        };
    }
}
