export interface ISessionsRootOptions {
    cookieName: string;
    cookieSecret: string;
    cookieMaxAgeMs: number;
    secure: boolean;
    connection: {
        redisUri: string;
    };
}
