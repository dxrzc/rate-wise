import { SystemLogger } from '../logging/system.logger';

export function logRedisClientError(error: Error | string, context: string) {
    SystemLogger.getInstance().error(`Redis client error: ${error}`, context);
}
