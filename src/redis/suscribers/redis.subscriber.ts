import { removeSessionFromUserIndex } from 'src/auth/functions/delete-key-from-set';
import { RedisClientType } from '@redis/client';
import { Injectable } from '@nestjs/common';

@Injectable()
export class RedisSubscriber {
    private subscriber: RedisClientType | undefined;

    async suscribe(redisClient: RedisClientType) {
        this.subscriber = redisClient.duplicate();
        await this.subscriber.connect();
        const listener = async (key: string) =>
            await removeSessionFromUserIndex(redisClient, key);
        await Promise.all([
            this.subscriber.subscribe('__keyevent@0__:del', listener),
            this.subscriber.subscribe('__keyevent@0__:expired', listener),
        ]);
    }

    disconnect() {
        if (this.subscriber) this.subscriber.destroy();
    }
}
