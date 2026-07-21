import { IHttpLoggerRootOptions } from './http-logger-root.options';

export interface IHttpLoggerOptionsFactory {
    create(): Promise<IHttpLoggerRootOptions> | IHttpLoggerRootOptions;
}
