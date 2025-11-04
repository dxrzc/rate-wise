export interface IGqlRequestLog {
    requestId: string;
    responseTime: string;
    ip: string;
    query: string;
    variables?: { [name: string]: any };
    error?: string;
}

export interface IRestRequestLog {
    requestId: string;
    responseTime: string;
    endpoint: string;
    ip: string;
}
