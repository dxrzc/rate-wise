import { ISessionDetails } from 'src/sessions/interfaces/session.details.interface';
import { SessionsService } from 'src/sessions/sessions.service';

/**
 * Helper to check if a session does not exist in redis
 */
export async function sessionIsFullyCleaned({
    sessionsService,
    ...sessionDetails
}: ISessionDetails & { sessionsService: SessionsService }): Promise<boolean> {
    const redisClient = sessionsService['redisClient'];
    const { indexKey, relationKey, sessKey } = sessionsService.getRedisKeys(sessionDetails);
    const [sess, relation, inIndex] = await Promise.all([
        redisClient.get(sessKey),
        redisClient.get(relationKey),
        redisClient.setIsMember(indexKey, sessionDetails.sessId),
    ]);
    return sess === null && relation === null && inIndex === false;
}
