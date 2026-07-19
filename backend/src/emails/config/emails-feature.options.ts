export interface IEmailsFeatureOptions {
    readonly queues: {
        readonly retryAttempts: number;
    };
}
