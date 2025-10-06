export interface IRequestLog {
    requestId: string;
    responseTime: string;
    ip: string;
    query: string;
    variables?: { [name: string]: any };
    error?: string;
}
