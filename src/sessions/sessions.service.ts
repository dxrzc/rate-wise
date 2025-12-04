import { userAndSessionRelationKey } from './functions/user-session-relation-key';
import { userSessionsSetKey } from 'src/sessions/functions/sessions-index-key';
import { RequestContext } from 'src/auth/types/request-context.type';
import { promisify } from 'src/common/functions/utils/promisify.util';
import { Inject, Injectable } from '@nestjs/common';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { SESS_REDIS_PREFIX, SESSIONS_REDIS_CONNECTION } from './constants/sessions.constants';
import { RedisClientAdapter } from 'src/common/redis/redis.client.adapter';

@Injectable()
export class SessionsService {
    constructor(
        @Inject(SESSIONS_REDIS_CONNECTION)
        private readonly redisClient: RedisClientAdapter,
        private readonly logger: HttpLoggerService,
    ) {}

    private async deleteAllUserSessions(sessIDs: string[]) {
        await Promise.all(
            sessIDs.map((id) => this.redisClient.delete(`${SESS_REDIS_PREFIX}${id}`)),
        );
    }

    private async deleteAllSessionRelations(sessIDs: string[]) {
        await Promise.all(
            sessIDs.map((id) => this.redisClient.delete(userAndSessionRelationKey(id))),
        );
    }

    private async deleteUserSessionsIndex(userID: string) {
        const key = userSessionsSetKey(userID);
        await this.redisClient.delete(key);
    }

    private async regenerate(req: RequestContext): Promise<void> {
        await promisify<void>((cb) => req.session.regenerate(cb));
        this.logger.debug(`Session regenerated`);
    }

    private async bindUserToSession(sessionId: string, userId: string) {
        await this.redisClient
            .transaction()
            .store(userAndSessionRelationKey(sessionId), userId)
            .setAdd(userSessionsSetKey(userId), sessionId)
            .exec();
    }

    async deleteAll(userId: string): Promise<void> {
        const sessIDs = await this.redisClient.setMembers(userSessionsSetKey(userId));
        await Promise.all([
            this.deleteAllUserSessions(sessIDs),
            this.deleteAllSessionRelations(sessIDs),
            this.deleteUserSessionsIndex(userId),
        ]);
        this.logger.debug(`All sessions for user ${userId} deleted`);
    }

    async count(userId: string): Promise<number> {
        const setkey = userSessionsSetKey(userId);
        return await this.redisClient.setSize(setkey);
    }

    async delete(req: RequestContext) {
        await promisify<void>((cb) => req.session.destroy(cb));
        this.logger.debug(`Session ${req.sessionID} deleted`);
    }

    async create(req: RequestContext, userId: string) {
        await this.regenerate(req);
        req.session.userId = userId;
        await this.bindUserToSession(req.sessionID, userId);
        this.logger.debug(`Session ${req.sessionID} created`);
    }
}
