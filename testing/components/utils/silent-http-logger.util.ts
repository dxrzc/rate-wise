import { HttpLoggerOptionsFactory } from 'src/http-logger/interfaces/http-logger.options.factory.interface';
import { IHttpLoggerOptions } from 'src/http-logger/interfaces/http-logger.options.interface';

export class SilentHttpLogger implements HttpLoggerOptionsFactory {
    create(): IHttpLoggerOptions {
        return {
            messages: {
                console: { silent: true },
                filesystem: {
                    silent: true,
                },
            },
            requests: {
                silent: true,
            },
        };
    }
}
