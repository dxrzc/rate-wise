import { Injectable } from '@nestjs/common';
import { RedisClientType } from '@redis/client';
import { removeSessionFromUserIndex } from 'src/auth/functions/delete-key-from-set';

@Injectable()
export class RedisSubscriber {
    private suscriber: RedisClientType | undefined;

    async suscribe(redisClient: RedisClientType) {
        this.suscriber = redisClient.duplicate();
        await this.suscriber.connect();
        const listener = async (key: string) =>
            await removeSessionFromUserIndex(redisClient, key);
        await Promise.all([
            this.suscriber.subscribe('__keyevent@0__:del', listener),
            this.suscriber.subscribe('__keyevent@0__:expired', listener),
        ]);
    }

    disconnect() {
        if (this.suscriber) this.suscriber.destroy();
    }
}
