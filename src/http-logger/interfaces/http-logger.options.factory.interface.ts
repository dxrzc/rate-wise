import { IHttpLoggerRootOptions } from './http-logger.root.options.interface';

export interface IHttpLoggerOptionsFactory {
    create(): Promise<IHttpLoggerRootOptions> | IHttpLoggerRootOptions;
}
