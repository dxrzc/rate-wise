export interface IRequestLog {
    method: string;
    requestId: string;
    responseTime: string;
    ip: string;
    error?: string;
}
