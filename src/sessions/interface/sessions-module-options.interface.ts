export interface ISessionsModuleOptions {
    redisUri: string;
    cookieName: string;
    cookieSecret: string;
    cookieMaxAgeMs: number;
    secure: boolean;
}
