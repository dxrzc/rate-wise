interface IPubSubConfigs {
    notifyKeyspaceEvents: string;
    subscriptions: {
        [event: string]: (client: any, payload: string) => Promise<void>;
    };
}

export interface IRedisClient {
    uri: string;
    pubSub?: IPubSubConfigs;
}
