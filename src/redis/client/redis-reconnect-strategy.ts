const MAX_RECONNECT_DELAY = 30000;
export const redisReconnectStrategy = (retries: number) => {
    // Calculate delay with exponential backoff: 2^retries * 50ms
    const exponentialDelay = Math.pow(2, retries) * 50;
    // Cap the delay at MAX_RECONNECT_DELAY
    const cappedDelay = Math.min(exponentialDelay, MAX_RECONNECT_DELAY);
    // Add jitter (random value between 0-1000ms) to prevent thundering herd
    const jitter = Math.floor(Math.random() * 1000);
    return cappedDelay + jitter;
};
