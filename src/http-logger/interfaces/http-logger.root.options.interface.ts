import {
    HttpConsoleLogOptions,
    HttpFileSystemLogOptions,
    HttpRequestLogOptions,
} from '../types/log.type';

export interface IHttpLoggerRootOptions {
    silentAll?: boolean;
    requests: HttpRequestLogOptions;
    messages: {
        filesystem: HttpFileSystemLogOptions;
        console: HttpConsoleLogOptions;
    };
}
