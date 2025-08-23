import { makeUserSessionRelationKey } from '../functions/make-user-session-relation-key';
import { makeSessionsIndexKey } from '../functions/make-sessions-index-key';
import { promisify } from 'src/common/functions/utils/promisify.util';
import { RequestContext } from '../types/request-context.type';
import { RedisService } from 'src/redis/redis.service';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Inject, Injectable } from '@nestjs/common';
import { Logger } from 'winston';

/*
    Every time a session is granted is added to a redis set like this.
            ______________________________________
            |                    |               |
            |                    | <session_1>   |
            |   index:<user_id>  | <session_2>   |
            |                    | <session_3>   |
            |____________________|_______________|        

    This helps us to limit the max sessions granted per user.
    When a session is deleted (the one created by express-session)    
    we need to remove that session from the user-sessions index. 
    The redis-subscriber will only get the redis-key, that is, the session-id
    but not the user-id, thus, the set can not be found.

    In order to solve this problem an extra record is created
            __________________________________________________
            |                             |                  |
            |    sess_user:<session_id>   |    <user_id>     | 
            |_____________________________|__________________| 

    When a session expires or is deleted, the redis subscriber is in charge of deleting 
    the session from the index and delete the sess_user record.   
*/
@Injectable()
export class SessionService {
    constructor(
        @Inject(WINSTON_MODULE_PROVIDER)
        private readonly logger: Logger,
        private readonly redisService: RedisService,
    ) {}

    // creates a session-user relation to track down sessions and their respective owners
    private async createSessionUserRelation(userId: string, sessionId: string) {
        await this.redisService.set(
            makeUserSessionRelationKey(sessionId),
            userId,
        );
        this.logger.debug(`Session-user relation created`);
    }

    // adds the sessionID to a set containing all the sessions belonging to a user
    private async addSessionToUserSet(userId: string, sessionID: string) {
        await this.redisService.addToSet(
            makeSessionsIndexKey(userId),
            sessionID,
        );
        this.logger.debug(`Session added to user sessions`);
    }

    // generate a new session id preventing session fixation
    private async regenerateSession(req: RequestContext): Promise<void> {
        await promisify<void>((cb) => req.session.regenerate(cb));
        this.logger.debug(`Session regenerated`);
    }

    async deleteAllSessions(userId: string): Promise<void> {
        const indexKey = makeSessionsIndexKey(userId);
        const sessionsIds = await this.redisService.setMembers(indexKey);
        const deletions = sessionsIds.map((sId) =>
            this.redisService.delete(`session:${sId}`),
        );
        await Promise.all(deletions);
        this.logger.debug(`All sessions of user ${userId} deleted`);
    }

    async activeSessions(userId: string): Promise<number> {
        return await this.redisService.getSetSize(makeSessionsIndexKey(userId));
    }

    async deleteSession(req: RequestContext) {
        await promisify<void>((cb) => req.session.destroy(cb));
        this.logger.debug(`Session ${req.sessionID} deleted`);
    }

    async newSession(req: RequestContext, userId: string) {
        await this.regenerateSession(req);
        req.session.userId = userId;
        await Promise.all([
            this.createSessionUserRelation(userId, req.sessionID),
            this.addSessionToUserSet(userId, req.sessionID),
        ]);
    }
}
