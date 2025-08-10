import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { RedisService } from 'src/redis/redis.service';
import { RequestContext } from '../types/request-context.type';
import { regenerateCookie } from '../functions/regenerate-cookie';
import { makeSessionsIndexKey } from '../functions/make-sessions-index-key';
import { makeUserSessionRelationKey } from '../functions/make-user-session-relation-key';

@Injectable()
export class SessionsService {
    constructor(private readonly redisService: RedisService) {}

    private async createSessionUserRelation(userId: string, sessionId: string) {
        await this.redisService.set(
            makeUserSessionRelationKey(sessionId),
            userId,
        );
    }

    async activeSessions(userId: string): Promise<number> {
        return await this.redisService.getSetSize(makeSessionsIndexKey(userId));
    }

    async newSession(req: RequestContext, userId: string) {
        const sessionsIndexKey = makeSessionsIndexKey(userId);
        const sessionId = await regenerateCookie(req, userId);
        await Promise.all([
            this.createSessionUserRelation(userId, sessionId),
            this.redisService.addToSet(sessionsIndexKey, sessionId),
        ]);
    }
}
