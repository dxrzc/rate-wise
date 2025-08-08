import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisSuscriber } from './suscribers/redis.suscriber';
import { ConfigurableModuleClass } from './redis.module-definition';

@Module({
    providers: [RedisService, RedisSuscriber],
    exports: [RedisService],
})
export class RedisModule extends ConfigurableModuleClass {}
