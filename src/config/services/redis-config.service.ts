import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IRedisConfigService } from '../interface/redis-config.interface';

@Injectable()
export class RedisConfigService {
    constructor(
        private readonly configService: ConfigService<
            IRedisConfigService,
            true
        >,
    ) {}

    get uri(): string {
        return this.configService.get('REDIS_URI');
    }
}
