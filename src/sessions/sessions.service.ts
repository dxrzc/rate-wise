import { userAndSessionRelationKey } from './functions/user-session-relation-key';
import { userSessionsSetKey } from 'src/sessions/functions/sessions-index-key';
import { RequestContext } from 'src/auth/types/request-context.type';
import { promisify } from 'src/common/functions/utils/promisify.util';
import { Inject, Injectable } from '@nestjs/common';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { SESS_REDIS_PREFIX, SESSIONS_REDIS_CONNECTION } from './constants/sessions.constants';
import { RedisClientAdapter } from 'src/common/redis/redis.client.adapter';
import { sessionKey } from './functions/session-key';
import { runSettledOrThrow } from 'src/common/functions/utils/run-settled-or-throw.util';

@Injectable()
export class SessionsService {
    constructor(
        @Inject(SESSIONS_REDIS_CONNECTION)
        private readonly redisClient: RedisClientAdapter,
        private readonly logger: HttpLoggerService,
    ) {}

    private async sessionCleanup(userId: string, sessId: string) {
        const indexKey = userSessionsSetKey(userId);
        const relationKey = userAndSessionRelationKey(sessId);
        const sessKey = sessionKey(sessId);
        await runSettledOrThrow([
            this.redisClient.delete(sessKey),
            this.redisClient.delete(relationKey),
            this.redisClient.setRem(indexKey, sessId),
        ]);
    }

    /*
        Session exists in redis but not in the user's sessions redis set or the user-session relation is missing
    */
    async isOrphaned(userId: string, sessId: string): Promise<boolean> {
        const indexKey = userSessionsSetKey(userId);
        const relationKey = userAndSessionRelationKey(sessId);
        let orphaned = false;
        const [sessInIndex, sessRelationExists] = await runSettledOrThrow([
            this.redisClient.setIsMember(indexKey, sessId),
            this.redisClient.get(relationKey),
        ]);
        // index
        if (!sessInIndex) {
            this.logger.warn("Orphaned session: not in user's sessions index");
            orphaned = true;
        }
        // relation
        if (!sessRelationExists) {
            this.logger.warn('Orphaned session: user-session relation does not exist');
            orphaned = true;
        }
        // cleanup if orphaned
        if (orphaned) await this.sessionCleanup(userId, sessId);
        return orphaned;
    }

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

    async deleteAll(userId: string): Promise<number> {
        const sessIDs = await this.redisClient.setMembers(userSessionsSetKey(userId));
        await Promise.all([
            this.deleteAllUserSessions(sessIDs),
            this.deleteAllSessionRelations(sessIDs),
            this.deleteUserSessionsIndex(userId),
        ]);
        this.logger.debug(`${sessIDs.length} sessions deleted for user ${userId}`);
        return sessIDs.length;
    }

    async count(userId: string): Promise<number> {
        const setkey = userSessionsSetKey(userId);
        return await this.redisClient.setSize(setkey);
    }

    async delete(req: RequestContext) {
        const userId = req.session.userId;
        const sessionId = req.sessionID;
        await promisify<void>((cb) => req.session.destroy(cb));
        if (userId) {
            await this.redisClient.setRem(userSessionsSetKey(userId), sessionId);
        }
        await this.redisClient.delete(userAndSessionRelationKey(sessionId));
        this.logger.debug(`Session ${sessionId} deleted`);
    }

    async create(req: RequestContext, userId: string) {
        await this.regenerate(req);
        req.session.userId = userId;
        await this.bindUserToSession(req.sessionID, userId);
        this.logger.debug(`Session ${req.sessionID} created`);
    }
}
