import {
    HttpRequestLogOptions,
    HttpConsoleLogOptions,
    HttpFileSystemLogOptions,
} from '../types/log.type';

export interface IHttpLoggerOptions {
    requests: HttpRequestLogOptions;
    messages: {
        filesystem: HttpFileSystemLogOptions;
        console: HttpConsoleLogOptions;
    };
}
