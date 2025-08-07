import { Module } from '@nestjs/common';
import { RedisService } from './redis.service';
import { ConfigurableModuleClass } from './redis.module-definition';

@Module({
    providers: [RedisService],
    exports: [RedisService],
})
export class RedisModule extends ConfigurableModuleClass {}
