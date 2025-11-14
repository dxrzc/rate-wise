import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { PAGINATION_CACHE_QUEUE } from './constants/pagination.constants';
import { PaginationService } from './pagination.service';
import { ConfigurableModuleClass } from './module/config.module-definition';
import { PaginationCacheService } from './cache/pagination.cache.service';

@Module({
    imports: [BullModule.registerQueue({ name: PAGINATION_CACHE_QUEUE })],
    providers: [PaginationCacheService, PaginationService],
    exports: [PaginationService],
})
export class PaginationModule extends ConfigurableModuleClass {}
