import { PAGINATION_CACHE_QUEUE } from './constants/pagination.constants';
import { ConfigurableModuleClass } from './module/config.module-definition';
import { PaginationService } from './pagination.service';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

@Module({
    imports: [BullModule.registerQueue({ name: PAGINATION_CACHE_QUEUE })],
    providers: [PaginationService],
    exports: [PaginationService],
})
export class PaginationModule extends ConfigurableModuleClass {}
