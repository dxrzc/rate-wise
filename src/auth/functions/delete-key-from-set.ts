import { RedisClientType } from '@redis/client';
import { makeSessionsIndexKey } from './make-sessions-index-key';
import { makeUserSessionRelationKey } from './make-user-session-relation-key';

export async function removeSessionFromUserIndex(
    redisClient: RedisClientType,
    recordKey: string,
) {
    if (recordKey.startsWith('session')) {
        const sessionId = recordKey.split(':').at(1);
        if (!sessionId) {
            throw new Error(
                `Invalid session key format: "${recordKey}". Expected "session:<id>"`,
            );
        }

        const userSessionRelationKey = makeUserSessionRelationKey(sessionId);
        const userId = await redisClient.get(userSessionRelationKey);

        if (userId) {
            await Promise.all([
                // remove from set
                redisClient.sRem(makeSessionsIndexKey(userId), sessionId),
                // remove session-userId relation record
                redisClient.del(userSessionRelationKey),
            ]);
        }
    }
}
