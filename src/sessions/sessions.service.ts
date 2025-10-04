import { userAndSessionRelationKey } from './functions/user-session-relation-key';
import { userSessionsSetKey } from 'src/sessions/functions/sessions-index-key';
import { RequestContext } from 'src/auth/types/request-context.type';
import { promisify } from 'src/common/functions/utils/promisify.util';
import { REDIS_AUTH } from 'src/redis/constants/redis.constants';
import { RedisService } from 'src/redis/redis.service';
import { Inject, Injectable } from '@nestjs/common';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';

@Injectable()
export class SessionsService {
    constructor(
        @Inject(REDIS_AUTH)
        private readonly redisService: RedisService,
        private readonly logger: HttpLoggerService,
    ) {}

    private async regenerate(req: RequestContext): Promise<void> {
        await promisify<void>((cb) => req.session.regenerate(cb));
        this.logger.debug(`Session regenerated`);
    }

    private async linkToUser(sessionId: string, userId: string) {
        await this.redisService
            .transaction()
            .store(userAndSessionRelationKey(sessionId), userId)
            .setAdd(userSessionsSetKey(userId), sessionId)
            .exec();
    }

    async deleteAll(userId: string): Promise<void> {
        const indexKey = userSessionsSetKey(userId);
        const sessionsIds = await this.redisService.setMembers(indexKey);
        const deletions = sessionsIds.map((sId) =>
            this.redisService.delete(`session:${sId}`),
        );
        await Promise.all(deletions);
        this.logger.debug(`All user ${userId} sessions deleted`);
    }

    async count(userId: string): Promise<number> {
        const setkey = userSessionsSetKey(userId);
        return await this.redisService.setSize(setkey);
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
