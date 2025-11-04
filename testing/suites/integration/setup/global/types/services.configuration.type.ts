export type ServicesConfig = {
    postgresUrl: string;
    mailpit: {
        smtpPort: number;
        apiPort: number;
    };
    redisUrls: {
        auth: string;
    };
};
