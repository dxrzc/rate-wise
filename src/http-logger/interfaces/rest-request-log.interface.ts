export interface IRestRequestLog {
    readonly requestId: string;
    readonly responseTime: string;
    readonly endpoint: string;
    readonly ip: string;
}
