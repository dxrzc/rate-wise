import {
    HttpConsoleLogOptions,
    HttpFileSystemLogOptions,
    HttpRequestLogOptions,
} from '../types/log.type';

export interface IHttpLoggerRootOptions {
    readonly silentAll?: boolean;
    readonly requests: HttpRequestLogOptions;
    messages: {
        readonly filesystem: HttpFileSystemLogOptions;
        readonly console: HttpConsoleLogOptions;
    };
}
