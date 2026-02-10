export interface IGqlRequestLog {
    readonly requestId: string;
    readonly responseTime: string;
    readonly ip: string;
    readonly query: string;
    readonly variables?: { [name: string]: unknown };
    readonly error?: string;
}
