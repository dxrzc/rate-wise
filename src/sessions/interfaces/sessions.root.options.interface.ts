export interface ISessionsRootOptions {
    readonly cookieName: string;
    readonly cookieSecret: string;
    readonly cookieMaxAgeMs: number;
    readonly secure: boolean;
    readonly connection: {
        readonly redisUri: string;
    };
}
