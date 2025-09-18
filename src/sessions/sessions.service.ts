import { userAndSessionRelationKey } from './functions/user-session-relation-key';
import { userSessionsSetKey } from 'src/sessions/functions/sessions-index-key';
import { HttpLoggerService } from 'src/logging/http/http-logger.service';
import { RequestContext } from 'src/auth/types/request-context.type';
import { promisify } from 'src/common/functions/utils/promisify.util';
import { RedisAdapter } from 'src/redis/redis.adapter';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SessionsService {
    constructor(
        private readonly redis: RedisAdapter,
        private readonly logger: HttpLoggerService,
    ) {}

    private async regenerateSession(req: RequestContext): Promise<void> {
        await promisify<void>((cb) => req.session.regenerate(cb));
        this.logger.debug(`Session regenerated`);
    }

    async deleteAllSessions(userId: string): Promise<void> {
        const indexKey = userSessionsSetKey(userId);
        const sessionsIds = await this.redis.setMembers(indexKey);
        const deletions = sessionsIds.map((sId) =>
            this.redis.delete(`session:${sId}`),
        );
        await Promise.all(deletions);
        this.logger.debug(`All user ${userId} sessions deleted`);
    }

    async activeSessions(userId: string): Promise<number> {
        const setkey = userSessionsSetKey(userId);
        return await this.redis.setSize(setkey);
    }

    async deleteSession(req: RequestContext) {
        await promisify<void>((cb) => req.session.destroy(cb));
        this.logger.debug(`Session ${req.sessionID} deleted`);
    }

    async linkUserSession(sessionId: string, userId: string) {
        await this.redis
            .transaction()
            .store(userAndSessionRelationKey(sessionId), userId)
            .setAdd(userSessionsSetKey(userId), sessionId)
            .exec();
    }

    async newSession(req: RequestContext, userId: string) {
        await this.regenerateSession(req);
        req.session.userId = userId;
        await this.linkUserSession(req.sessionID, userId);
        this.logger.debug(`Session ${req.sessionID} created`);
    }
}
