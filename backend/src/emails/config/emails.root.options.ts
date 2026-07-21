export interface IEmailsRootOptions {
    readonly smtp: Readonly<{
        port: number;
        host: string;
        user: string;
        pass: string;
    }>;
}
