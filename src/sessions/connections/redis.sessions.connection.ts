import { makeUserSessionRelationKey } from '../functions/make-user-session-relation-key';
import { REDIS_SESSIONS_CLIENT } from '../constants/redis-sessions-client.constant';
import { makeSessionsIndexKey } from '../functions/make-sessions-index-key';
import { RedisClientType } from '@redis/client';
import {
    BeforeApplicationShutdown,
    Inject,
    Injectable,
    OnModuleInit,
} from '@nestjs/common';

@Injectable()
export class RedisSessionsConnectionManager
    implements OnModuleInit, BeforeApplicationShutdown
{
    private subscriber: RedisClientType | undefined;

    constructor(
        @Inject(REDIS_SESSIONS_CLIENT)
        private readonly redisClient: RedisClientType,
    ) {}

    private async removeSession(recordKey: string) {
        if (recordKey.startsWith('session')) {
            const sessionId = recordKey.split(':').at(1);
            if (!sessionId) {
                throw new Error(`Invalid session key format`);
            }

            const userSessionRelationKey =
                makeUserSessionRelationKey(sessionId);
            const userId = await this.redisClient.get(userSessionRelationKey);

            if (userId) {
                await Promise.all([
                    // remove from set
                    this.redisClient.sRem(
                        makeSessionsIndexKey(userId),
                        sessionId,
                    ),
                    // remove session-userId relation record
                    this.redisClient.del(userSessionRelationKey),
                ]);
            }
        }
    }

    private async configureSubscriber() {
        this.subscriber = this.redisClient.duplicate();
        await this.subscriber.connect();
        const listener = async (key: string) => await this.removeSession(key);
        await this.redisClient.configSet('notify-keyspace-events', 'ExgK');
        await Promise.all([
            this.subscriber.subscribe('__keyevent@0__:del', listener),
            this.subscriber.subscribe('__keyevent@0__:expired', listener),
        ]);
    }

    async onModuleInit() {
        await this.redisClient.connect();
        await this.configureSubscriber();
    }

    async beforeApplicationShutdown() {
        await this.redisClient.quit();
    }
}
