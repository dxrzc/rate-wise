import {
    Inject,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { createClient } from 'redis';
import { RedisClientType } from '@redis/client';
import { MODULE_OPTIONS_TOKEN } from './redis.module-definition';
import { IRedisModuleOptions } from './interfaces/redis-module-options.interface';

@Injectable()
export class RedisService {
    private redisClient: RedisClientType;

    constructor(
        @Inject(MODULE_OPTIONS_TOKEN)
        private readonly redisOpts: IRedisModuleOptions,
    ) {
        this.redisClient = createClient({ url: redisOpts.uri });
        this.redisClient.connect().catch((err) => {
            console.error(err);
            throw new InternalServerErrorException();
        });
    }

    get client() {
        return this.redisClient;
    }
}
