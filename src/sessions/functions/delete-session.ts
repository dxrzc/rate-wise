/**
 * node-redis has serious performance issues when working with typescript
 * so do not use the "RedisClientType" type.
 */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { userSessionsSetKey } from './sessions-index-key';
import { userAndSessionRelationKey } from './user-session-relation-key';

export async function deleteSession(redisClient: any, recordKey: string) {
    if (recordKey.startsWith('session')) {
        const sessionId = recordKey.split(':').at(1);
        if (!sessionId) {
            throw new Error(`Invalid session key format`);
        }
        const userSessionRelationKey = userAndSessionRelationKey(sessionId);
        const userId = <string>await redisClient.get(userSessionRelationKey);

        if (userId) {
            await Promise.all([
                // remove from set
                redisClient.sRem(userSessionsSetKey(userId), sessionId),
                // remove session-userId relation record
                redisClient.del(userSessionRelationKey),
            ]);
        }
    }
}
