import { IHttpLoggerOptionsFactory } from 'src/http-logger/interfaces/http-logger.options.factory.interface';
import { IHttpLoggerRootOptions } from 'src/http-logger/interfaces/http-logger.root.options.interface';

export class SilentHttpLogger implements IHttpLoggerOptionsFactory {
    create(): IHttpLoggerRootOptions {
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
