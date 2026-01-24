import { SystemLogger } from '../logging/system.logger';

export function logRedisClientError(error: Error | string, context: string) {
    const message = error instanceof Error ? error.message : error;
    SystemLogger.getInstance().error(`Redis client error: ${message}`, context);
}
