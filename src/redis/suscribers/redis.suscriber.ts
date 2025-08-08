import { Injectable } from '@nestjs/common';
import { RedisClientType } from '@redis/client';
import { removeSessionFromUserIndex } from 'src/auth/functions/delete-key-from-set';

@Injectable()
export class RedisSuscriber {
    async suscribe(redisClient: RedisClientType) {
        const suscriber = redisClient.duplicate();
        await suscriber.connect();
        const listener = async (key: string) =>
            await removeSessionFromUserIndex(redisClient, key);
        await Promise.all([
            suscriber.subscribe('__keyevent@0__:del', listener),
            suscriber.subscribe('__keyevent@0__:expired', listener),
        ]);
    }
}
