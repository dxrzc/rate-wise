export interface IRedisConnectionOptions {
    readonly redisUri: string;
    readonly context: string;
    readonly disableOfflineQueue: boolean;
}
