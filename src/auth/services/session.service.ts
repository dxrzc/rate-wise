import { Injectable } from '@nestjs/common';
import { RedisService } from 'src/redis/redis.service';
import { RequestContext } from '../types/request-context.type';
import { promisify } from 'src/common/functions/utils/promisify.util';
import { makeSessionsIndexKey } from '../functions/make-sessions-index-key';
import { makeUserSessionRelationKey } from '../functions/make-user-session-relation-key';

@Injectable()
export class SessionsService {
    constructor(private readonly redisService: RedisService) {}

    // creates a session-user relation to track down sessions and their respective owners
    private async createSessionUserRelation(userId: string, sessionId: string) {
        await this.redisService.set(
            makeUserSessionRelationKey(sessionId),
            userId,
        );
    }

    // adds the sessionID to a set containing all the sessions belonging to a user
    private async addSessionToUserSet(userId: string, sessionID: string) {
        await this.redisService.addToSet(
            makeSessionsIndexKey(userId),
            sessionID,
        );
    }

    // generate a new session id preventing session fixation
    private async regenerateSession(req: RequestContext): Promise<void> {
        await promisify<void>((cb) => req.session.regenerate(cb));
    }

    async activeSessions(userId: string): Promise<number> {
        return await this.redisService.getSetSize(makeSessionsIndexKey(userId));
    }

    async deleteSession(req: RequestContext) {
        await promisify<void>((cb) => req.session.destroy(cb));
    }

    async newSession(req: RequestContext, userId: string) {
        await this.regenerateSession(req);
        req.session.userId = userId;
        await Promise.all([
            this.createSessionUserRelation(userId, req.sessionID),
            this.addSessionToUserSet(userId, req.sessionID),
        ]);
    }
}
