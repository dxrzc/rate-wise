import { PAGINATION_CACHE_QUEUE } from './di/pagination.providers';
import { ConfigurableModuleClass } from './config/config.module-definition';
import { PaginationService } from './pagination.service';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { PaginationCacheProducer } from './queues/pagination-cache.producer';
import { PaginationCacheConsumer } from './queues/pagination-cache.consumer';

@Module({
    imports: [BullModule.registerQueue({ name: PAGINATION_CACHE_QUEUE })],
    providers: [PaginationService, PaginationCacheProducer, PaginationCacheConsumer],
    exports: [PaginationService],
})
export class PaginationModule extends ConfigurableModuleClass {}
