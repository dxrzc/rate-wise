export interface IEmailInfo {
    readonly to: string;
    readonly from: string;
    readonly subject: string;
    readonly text?: string;
    readonly html: string;
}
