import { Injectable } from '@nestjs/common';
import { ServerConfigService } from 'src/config/services/server.config.service';
import { IHttpLoggerOptionsFactory } from 'src/http-logger/interfaces/http-logger.options.factory.interface';
import { IHttpLoggerOptions } from 'src/http-logger/interfaces/http-logger.options.interface';

@Injectable()
export class HttpLoggerConfigService implements IHttpLoggerOptionsFactory {
    constructor(private readonly serverConfig: ServerConfigService) {}

    create(): IHttpLoggerOptions {
        const logsDir = this.serverConfig.isProduction
            ? 'logs/prod'
            : 'logs/dev';
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
                    minLevel: this.serverConfig.isDevelopment
                        ? 'debug'
                        : 'info',
                },
            },
        };
    }
}
