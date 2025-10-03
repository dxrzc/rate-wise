export const calculateTokenTTLSeconds = (expirationDateUnix: number) => {
    const currentTimeInSeconds = Math.floor(Date.now() / 1000);
    const remainingTokenTTLInSeconds =
        expirationDateUnix - currentTimeInSeconds;
    return remainingTokenTTLInSeconds;
};
