import { makeUserSessionRelationKey } from '../functions/make-user-session-relation-key';
import { makeSessionsIndexKey } from '../functions/make-sessions-index-key';
import { HttpLoggerService } from 'src/logging/http/http-logger.service';
import { promisify } from 'src/common/functions/utils/promisify.util';
import { RequestContext } from '../types/request-context.type';
import { RedisService } from 'src/redis/redis.service';
import { Injectable } from '@nestjs/common';

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
        private readonly logger: HttpLoggerService,
        private readonly redisService: RedisService,
    ) {}

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

    async linkUserSession(sessionId: string, userId: string) {
        await this.redisService.client
            .multi()
            .sAdd(makeSessionsIndexKey(userId), sessionId)
            .set(makeUserSessionRelationKey(sessionId), userId)
            .exec();
        this.logger.debug(`Session ${sessionId} linked to user ${userId}`);
    }

    async newSession(req: RequestContext, userId: string) {
        await this.regenerateSession(req);
        req.session.userId = userId;
        await this.linkUserSession(req.sessionID, userId);
    }
}
