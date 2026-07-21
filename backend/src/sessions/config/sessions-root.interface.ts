export interface ISessionsRootOptions {
    readonly cookieName: string;
    readonly cookieSecret: string;
    readonly cookieMaxAgeMs: number;
    readonly secure: boolean;
    readonly sameSite: 'lax' | 'strict';
    readonly connection: {
        readonly redisUri: string;
    };
}
