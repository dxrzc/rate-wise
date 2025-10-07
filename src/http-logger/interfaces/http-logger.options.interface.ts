import {
    HttpRequestLogOptions,
    HttpConsoleLogOptions,
    HttpFileSystemLogOptions,
} from '../types/log.type';

export interface IHttpLoggerOptions {
    silentAll?: boolean;
    requests: HttpRequestLogOptions;
    messages: {
        filesystem: HttpFileSystemLogOptions;
        console: HttpConsoleLogOptions;
    };
}

export interface IHttpLoggerForFeatureOptions {
    context: string;
}
