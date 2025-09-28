import { userAndSessionRelationKey } from './functions/user-session-relation-key';
import { userSessionsSetKey } from 'src/sessions/functions/sessions-index-key';
import { HttpLoggerService } from 'src/logging/http/http-logger.service';
import { RequestContext } from 'src/auth/types/request-context.type';
import { promisify } from 'src/common/functions/utils/promisify.util';
import { REDIS_SESSIONS_CLIENT } from './constants/redis-sess-client.token.constant';
import { RedisAdapter } from 'src/common/redis/redis.adapter';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class SessionsService {
    constructor(
        @Inject(REDIS_SESSIONS_CLIENT)
        private readonly redis: RedisAdapter,
        private readonly logger: HttpLoggerService,
    ) {}

    private async regenerate(req: RequestContext): Promise<void> {
        await promisify<void>((cb) => req.session.regenerate(cb));
        this.logger.debug(`Session regenerated`);
    }

    private async linkToUser(sessionId: string, userId: string) {
        await this.redis
            .transaction()
            .store(userAndSessionRelationKey(sessionId), userId)
            .setAdd(userSessionsSetKey(userId), sessionId)
            .exec();
    }

    async deleteAll(userId: string): Promise<void> {
        const indexKey = userSessionsSetKey(userId);
        const sessionsIds = await this.redis.setMembers(indexKey);
        const deletions = sessionsIds.map((sId) =>
            this.redis.delete(`session:${sId}`),
        );
        await Promise.all(deletions);
        this.logger.debug(`All user ${userId} sessions deleted`);
    }

    async count(userId: string): Promise<number> {
        const setkey = userSessionsSetKey(userId);
        return await this.redis.setSize(setkey);
    }

    async delete(req: RequestContext) {
        await promisify<void>((cb) => req.session.destroy(cb));
        this.logger.debug(`Session ${req.sessionID} deleted`);
    }

    async create(req: RequestContext, userId: string) {
        await this.regenerate(req);
        req.session.userId = userId;
        await this.linkToUser(req.sessionID, userId);
        this.logger.debug(`Session ${req.sessionID} created`);
    }
}
