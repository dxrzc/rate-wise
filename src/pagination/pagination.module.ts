import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { PAGINATION_CACHE_QUEUE } from './constants/pagination.constants';
import { PaginationService } from './pagination.service';

@Module({
    imports: [BullModule.registerQueue({ name: PAGINATION_CACHE_QUEUE })],
    providers: [PaginationService],
    exports: [PaginationService],
})
export class PaginationModule {}
