export type IAls<T = Record<string, unknown>> = {
    [prop in keyof T]: T[prop];
} & { requestId: string };
