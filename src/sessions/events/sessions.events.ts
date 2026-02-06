import { createSessionAndUserMappingKey } from '../keys/create-session-and-user-mapping-key';
import { createUserSessionsSetKey } from '../keys/create-sessions-index-key';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { RedisClientAdapter } from 'src/common/redis/redis.client.adapter';
import { SESSIONS_REDIS_CONNECTION } from '../di/sessions.providers';
import { SystemLogger } from 'src/common/logging/system.logger';

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

        const userSessionRelationKey = createSessionAndUserMappingKey(sessionId);
        const userId = await this.redisClient.get<string>(userSessionRelationKey);
        const sysLogger = SystemLogger.getInstance();

        if (userId) {
            this.redisClient.delete(userSessionRelationKey).catch((err) => {
                sysLogger.error(
                    `Failed to delete user-session record: ${String(err)}`,
                    SessionsEvents.name,
                );
            });
            this.redisClient.setRem(createUserSessionsSetKey(userId), sessionId).catch((err) => {
                sysLogger.error(
                    `Failed to delete session from user's sessions index: ${String(err)}`,
                    SessionsEvents.name,
                );
            });
        }
    }
}
