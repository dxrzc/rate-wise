import { Injectable } from '@nestjs/common';
import { Request } from 'express';
import { RedisService } from 'src/redis/redis.service';
import { makeSessionsIndexKey } from '../functions/make-sessions-index-key';
import { ISessionData } from 'src/common/interfaces/cookies/session-data.interface';
import { regenerateCookie } from '../functions/regenerate-cookie';

@Injectable()
export class SessionCookiesService {
    constructor(private readonly redisService: RedisService) {}

    async newSession(req: Request & { session: ISessionData }, userId: string) {
        const sessionsIndexKey = makeSessionsIndexKey(userId);
        const sessionId = await regenerateCookie(req, userId);
        await this.redisService.addToSet(sessionsIndexKey, sessionId);
    }
}
