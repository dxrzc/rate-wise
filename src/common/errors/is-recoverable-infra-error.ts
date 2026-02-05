export function isRecoverableInfraError(err: Error): boolean {
    return (
        err.message.includes('Socket closed unexpectedly') ||
        err.message.includes('Socket timeout') ||
        err.message.includes('ECONNRESET') ||
        err.message.includes('ENOTFOUND redis_cache')
    );
}
