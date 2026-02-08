import { IHttpLoggerOptionsFactory } from 'src/http-logger/config/http-logger-factory.options';
import { IHttpLoggerRootOptions } from 'src/http-logger/config/http-logger-root.options';

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
