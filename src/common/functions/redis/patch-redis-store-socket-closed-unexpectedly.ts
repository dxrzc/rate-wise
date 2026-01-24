/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import KeyvRedis, { createClient, RedisClientType } from '@keyv/redis';
import { SystemLogger } from 'src/common/logging/system.logger';

export const patchRedisStoreSocketClosedUnexpectedly = async (keyvRedis: KeyvRedis<unknown>) => {
    const oldClient = keyvRedis.client as RedisClientType;
    SystemLogger.getInstance().log('Retryng redis client reconnection', 'Cache');
    try {
        // shut down broken client
        try {
            await oldClient?.close();
        } catch {
            // ignore
        }
        try {
            oldClient?.destroy();
        } catch {
            // ignore
        }
        // create new redis client
        const newClient = createClient(oldClient.options);
        await newClient.connect();
        // patch with new client
        keyvRedis.client = newClient as any;
        SystemLogger.getInstance().log('Redis client successfully reconnected', 'Cache');
    } catch (err) {
        SystemLogger.getInstance().error(
            `Redis client reconnection failed: ${String(err)}`,
            'Cache',
        );
    }
};
