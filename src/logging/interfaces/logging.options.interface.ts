import {
    ConsoleLogOptions,
    FileSystemLogOptions,
    RequestLogOptions,
} from '../types/log.type';

export interface ILoggingOptions {
    requests: RequestLogOptions;
    messages: {
        filesystem: FileSystemLogOptions;
        console: ConsoleLogOptions;
    };
}
