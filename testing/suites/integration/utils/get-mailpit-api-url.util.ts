export const getMailpitApiUrl = (): string =>
    `http://localhost:${process.env.MAILPIT_API_PORT}/api/v1`;
