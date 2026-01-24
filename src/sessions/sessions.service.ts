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
import { ISessionDetails } from './interfaces/session.details.interface';
import { ISessionKeys } from './interfaces/session.keys.interface';

@Injectable()
export class SessionsService {
    constructor(
        @Inject(SESSIONS_REDIS_CONNECTION)
        private readonly redisClient: RedisClientAdapter,
        private readonly logger: HttpLoggerService,
    ) {}

    /**
     * Returns the keys used in redis for index, relation and session
     * @param sessionDetails details of the session
     * @returns object containing the keys
     */
    getRedisKeys(sessionDetails: ISessionDetails): ISessionKeys {
        const indexKey = userSessionsSetKey(sessionDetails.userId);
        const relationKey = userAndSessionRelationKey(sessionDetails.sessId);
        const sessKey = sessionKey(sessionDetails.sessId);
        return { indexKey, relationKey, sessKey };
    }

    /**
     * Check if the session is fully deleted in redis.
     * @param sessionDetails details of the session
     * @returns boolean indicating if the session is completed deleted from redis
     */
    async isFullyCleaned(sessionDetails: ISessionDetails): Promise<boolean> {
        const { indexKey, relationKey, sessKey } = this.getRedisKeys(sessionDetails);
        const [sess, relation, inIndex] = await Promise.all([
            this.redisClient.get(sessKey),
            this.redisClient.get(relationKey),
            this.redisClient.setIsMember(indexKey, sessionDetails.sessId),
        ]);
        return sess === null && relation === null && inIndex === false;
    }

    /**
     * Cleans up all redis keys related to a session.
     * @param sessionDetails details of the session
     */
    async sessionCleanup(sessionDetails: ISessionDetails): Promise<void> {
        const { indexKey, relationKey, sessKey } = this.getRedisKeys(sessionDetails);
        await runSettledOrThrow([
            this.redisClient.delete(sessKey),
            this.redisClient.delete(relationKey),
            this.redisClient.setRem(indexKey, sessionDetails.sessId),
        ]);
    }

    /**
     * Check if the session state is inconsistent in Redis
     * @param sessionDetails details of the session
     * @returns boolean indicating if the session is a dangling session
     */
    async isDangling(sessionDetails: ISessionDetails): Promise<boolean> {
        const { indexKey, relationKey } = this.getRedisKeys(sessionDetails);
        let dangling = false;
        const [sessInIndex, sessRelationExists] = await runSettledOrThrow([
            this.redisClient.setIsMember(indexKey, sessionDetails.sessId),
            this.redisClient.get(relationKey),
        ]);
        // index
        if (!sessInIndex) {
            this.logger.warn("Orphaned session: not in user's sessions index");
            dangling = true;
        }
        // relation
        if (!sessRelationExists) {
            this.logger.warn('Orphaned session: user-session relation does not exist');
            dangling = true;
        }
        return dangling;
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

    /**
     * Destroys the session in the req object and deletes the redis records related
     * @param req request object
     */
    async destroy(req: RequestContext) {
        const userId = req.session.userId;
        const sessionId = req.sessionID;
        await runSettledOrThrow([
            promisify<void>((cb) => req.session.destroy(cb)),
            this.redisClient.setRem(userSessionsSetKey(userId), sessionId),
            this.redisClient.delete(userAndSessionRelationKey(sessionId)),
        ]);
        this.logger.debug(`Session ${sessionId} deleted`);
    }

    /**
     * Creates a session cookie
     *
     * Binds the session to user doing the following:
     * - Adds the session id in a redis set to keep track of the user's sessions
     * - Creates a user-session(id) relation record in redis
     * @param req request object
     * @param userId id of the user
     */
    async create(req: RequestContext, userId: string) {
        await this.regenerate(req);
        req.session.userId = userId;
        await this.bindUserToSession(req.sessionID, userId);
        this.logger.info(`Session created`);
    }
}
