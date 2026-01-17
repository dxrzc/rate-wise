import { userAndSessionRelationKey } from '../functions/user-session-relation-key';
import { userSessionsSetKey } from '../functions/sessions-index-key';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { RedisClientAdapter } from 'src/common/redis/redis.client.adapter';
import { SESSIONS_REDIS_CONNECTION } from '../constants/sessions.constants';

@Injectable()
export class SessionsEvents implements OnModuleInit {
    constructor(
        @Inject(SESSIONS_REDIS_CONNECTION)
        private readonly redisClient: RedisClientAdapter,
    ) {}

    async onModuleInit() {
        const listener = (key: string) => this.handleRemovedSession(key);
        await this.redisClient.connection.addSubscriber('__keyevent@0__:expired', listener);
    }

    async handleRemovedSession(key: string): Promise<void> {
        if (!key.startsWith('session')) return;

        const sessionId = key.split(':').at(1);
        if (!sessionId) throw new Error(`Invalid session key format`);

        const userSessionRelationKey = userAndSessionRelationKey(sessionId);
        const userId = await this.redisClient.get<string>(userSessionRelationKey);

        if (userId) {
            await Promise.all([
                // remove session-userId relation record
                this.redisClient.delete(userSessionRelationKey),
                // remove from set
                this.redisClient.setRem(userSessionsSetKey(userId), sessionId),
            ]);
        }
    }
}
