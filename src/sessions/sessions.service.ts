import { makeUserSessionRelationKey } from 'src/auth/functions/make-user-session-relation-key';
import { REDIS_SESSIONS_CLIENT } from './constants/redis-sessions-client.constant';
import { makeSessionsIndexKey } from 'src/auth/functions/make-sessions-index-key';
import { HttpLoggerService } from 'src/logging/http/http-logger.service';
import { RequestContext } from 'src/auth/types/request-context.type';
import { promisify } from 'src/common/functions/utils/promisify.util';
import { Inject, Injectable } from '@nestjs/common';
import { RedisClientType } from 'redis';

@Injectable()
export class SessionsService {
    constructor(
        @Inject(REDIS_SESSIONS_CLIENT)
        private readonly redisClient: RedisClientType,
        private readonly logger: HttpLoggerService,
    ) {}

    private async regenerateSession(req: RequestContext): Promise<void> {
        await promisify<void>((cb) => req.session.regenerate(cb));
        this.logger.debug(`Session regenerated`);
    }

    async deleteAllSessions(userId: string): Promise<void> {
        const indexKey = makeSessionsIndexKey(userId);
        const sessionsIds = await this.redisClient.sMembers(indexKey);
        const deletions = sessionsIds.map((sId) =>
            this.redisClient.del(`session:${sId}`),
        );
        await Promise.all(deletions);
        this.logger.debug(`All user ${userId} sessions deleted`);
    }

    async activeSessions(userId: string): Promise<number> {
        return await this.redisClient.sCard(makeSessionsIndexKey(userId));
    }

    async deleteSession(req: RequestContext) {
        await promisify<void>((cb) => req.session.destroy(cb));
        this.logger.debug(`Session ${req.sessionID} deleted`);
    }

    async linkUserSession(sessionId: string, userId: string) {
        await this.redisClient
            .multi()
            .sAdd(makeSessionsIndexKey(userId), sessionId)
            .set(makeUserSessionRelationKey(sessionId), userId)
            .exec();
    }

    async newSession(req: RequestContext, userId: string) {
        await this.regenerateSession(req);
        req.session.userId = userId;
        await this.linkUserSession(req.sessionID, userId);
        this.logger.debug(`Session ${req.sessionID} created`);
    }
}
