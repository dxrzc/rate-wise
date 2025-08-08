import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { RedisService } from 'src/redis/redis.service';
import { makeSessionsIndexKey } from '../functions/make-sessions-index-key';
import { ISessionData } from 'src/common/interfaces/cookies/session-data.interface';
import { regenerateCookie } from '../functions/regenerate-cookie';
import { makeUserSessionRelationKey } from '../functions/make-user-session-relation-key';

@Injectable()
export class SessionCookiesService {
    constructor(private readonly redisService: RedisService) {}

    private async createSessionUserRelation(userId: string, sessionId: string) {
        await this.redisService.set(
            makeUserSessionRelationKey(sessionId),
            userId,
        );
    }

    async newSession(req: Request & { session: ISessionData }, userId: string) {
        const sessionsIndexKey = makeSessionsIndexKey(userId);
        const sessionId = await regenerateCookie(req, userId);
        await Promise.all([
            this.createSessionUserRelation(userId, sessionId),
            this.redisService.addToSet(sessionsIndexKey, sessionId),
        ]);
    }
}
