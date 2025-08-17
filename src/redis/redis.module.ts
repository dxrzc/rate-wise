import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { RedisSubscriber } from './suscribers/redis.subscriber';
import { ConfigurableModuleClass } from './redis.module-definition';

@Module({
    providers: [RedisService, RedisSubscriber],
    exports: [RedisService],
})
export class RedisModule extends ConfigurableModuleClass {}
