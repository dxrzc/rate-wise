import { userAndSessionRelationKey } from '../functions/user-session-relation-key';
import { userSessionsSetKey } from '../functions/sessions-index-key';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { REDIS_AUTH } from 'src/redis/constants/redis.constants';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class SessionsEvents implements OnModuleInit {
    constructor(
        @Inject(REDIS_AUTH)
        private readonly redisService: RedisService,
    ) {}

    async onModuleInit() {
        const listener = (key: string) => this.handleRemovedSession(key);
        await Promise.all([
            this.redisService.connection.addSubscriber(
                '__keyevent@0__:del',
                listener,
            ),
            this.redisService.connection.addSubscriber(
                '__keyevent@0__:expired',
                listener,
            ),
        ]);
    }

    async handleRemovedSession(key: string): Promise<void> {
        if (!key.startsWith('session')) return;

        const sessionId = key.split(':').at(1);
        if (!sessionId) throw new Error(`Invalid session key format`);

        const userSessionRelationKey = userAndSessionRelationKey(sessionId);
        const userId = await this.redisService.get<string>(
            userSessionRelationKey,
        );

        if (userId) {
            await Promise.all([
                // remove session-userId relation record
                this.redisService.delete(userSessionRelationKey),
                // remove from set
                this.redisService.setRem(userSessionsSetKey(userId), sessionId),
            ]);
        }
    }
}
