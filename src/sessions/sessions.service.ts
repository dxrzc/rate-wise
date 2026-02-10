import { createSessionAndUserMappingKey } from './keys/create-session-and-user-mapping-key';
import { createUserSessionsSetKey } from 'src/sessions/keys/create-sessions-index-key';
import { RequestContext } from 'src/auth/types/request-context.type';
import { promisify } from 'src/common/utils/promisify.util';
import { Inject, Injectable } from '@nestjs/common';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { SESSIONS_REDIS_CONNECTION, SESSIONS_ROOT_OPTIONS } from './di/sessions.providers';
import { RedisClientAdapter } from 'src/redis/client/redis.client.adapter';
import { createSessionKey } from './keys/create-session-key';
import { runSettledOrThrow } from 'src/common/utils/run-settled-or-throw.util';
import { ISessionDetails } from './interfaces/session-details.interface';
import { ISessionKeys } from './interfaces/session-keys.interface';
import { SystemLogger } from 'src/common/logging/system.logger';
import { Response } from 'express';
import { ISessionsRootOptions } from './config/sessions-root.interface';

@Injectable()
export class SessionsService {
    constructor(
        @Inject(SESSIONS_REDIS_CONNECTION)
        private readonly redisClient: RedisClientAdapter,
        @Inject(SESSIONS_ROOT_OPTIONS)
        private sessionOptions: ISessionsRootOptions,
        private readonly logger: HttpLoggerService,
    ) {}

    clearCookie(res: Response) {
        res.clearCookie(this.sessionOptions.cookieName, {
            path: '/',
            secure: this.sessionOptions.secure,
            sameSite: this.sessionOptions.sameSite,
        });
    }

    /**
     * Returns the keys used in redis for index, relation and session
     * @param sessionDetails details of the session
     * @returns object containing the keys
     */
    getRedisKeys(sessionDetails: ISessionDetails): ISessionKeys {
        const indexKey = createUserSessionsSetKey(sessionDetails.userId);
        const relationKey = createSessionAndUserMappingKey(sessionDetails.sessId);
        const sessKey = createSessionKey(sessionDetails.sessId);
        return { indexKey, relationKey, sessKey };
    }

    /**
     * Tries ot clean up all the redis keys related to the current session.
     * If the operation fails the error is logged.
     * @param sessionDetails details of the session
     */
    async trySessionCleanup(req: RequestContext): Promise<void> {
        try {
            const userId = req.session.userId;
            const sessId = req.sessionID;
            const { indexKey, relationKey, sessKey } = this.getRedisKeys({ userId, sessId });
            await runSettledOrThrow([
                promisify<void>((cb) => req.session.destroy(cb)),
                this.redisClient.delete(sessKey),
                this.redisClient.delete(relationKey),
                this.redisClient.setRem(indexKey, sessId),
            ]);
        } catch (error) {
            this.logger.error('Session cleanup failed');
            SystemLogger.getInstance().logAnyException(error, SessionsService.name);
        }
    }

    /**
     * Checks if the session state is inconsistent in Redis
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

    /**
     * Deletes all the user's sessions in redis. Does not destroy the current session
     * @param userId id of the user
     * @returns the number of sessions belonging to the user
     */
    async deleteAll(userId: string): Promise<number> {
        const indexKey = createUserSessionsSetKey(userId);
        const sessIDs = await this.redisClient.setMembers(indexKey);
        await runSettledOrThrow([
            // all sessions
            runSettledOrThrow(sessIDs.map((id) => this.redisClient.delete(createSessionKey(id)))),
            // index
            this.redisClient.delete(indexKey),
            // every user-session relation
            runSettledOrThrow(
                sessIDs.map((id) => this.redisClient.delete(createSessionAndUserMappingKey(id))),
            ),
        ]);
        this.logger.info('All sessions deleted');
        return sessIDs.length;
    }

    /**
     * Destroys the current sessions and deletes all the user's sessions in redis
     * @param userId id of the user
     * @returns the number of sessions destroyed
     */
    async destroyAll(req: RequestContext): Promise<number> {
        const userId = req.session.userId;
        // current
        const [numberOfSessions] = await runSettledOrThrow<[number, void]>([
            this.deleteAll(userId),
            promisify<void>((cb) => req.session.destroy(cb)),
        ]);
        return numberOfSessions;
    }

    /**
     * @param userId id of the user
     * @returns the number of sessions belonging to this user
     */
    async count(userId: string): Promise<number> {
        const setkey = createUserSessionsSetKey(userId);
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
            this.redisClient.setRem(createUserSessionsSetKey(userId), sessionId),
            this.redisClient.delete(createSessionAndUserMappingKey(sessionId)),
        ]);
        this.logger.info('Session destroyed');
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
        await promisify<void>((cb) => req.session.regenerate(cb));
        req.session.userId = userId;
        await this.redisClient
            .transaction()
            .store(createSessionAndUserMappingKey(req.sessionID), userId)
            .setAdd(createUserSessionsSetKey(userId), req.sessionID)
            .exec();
        this.logger.info(`Session created`);
    }
}
