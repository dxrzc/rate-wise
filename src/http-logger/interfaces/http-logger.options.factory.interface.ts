import { IHttpLoggerOptions } from './http-logger.options.interface';

export interface IHttpLoggerOptionsFactory {
    create(): Promise<IHttpLoggerOptions> | IHttpLoggerOptions;
}
