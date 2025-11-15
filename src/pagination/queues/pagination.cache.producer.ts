import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { PAGINATION_CACHE_QUEUE } from '../constants/pagination.constants';
import { Queue } from 'bullmq';
import { CacheJobData } from '../types/cache-job.data.type';

@Injectable()
export class PaginationCacheProducer {
    constructor(
        @InjectQueue(PAGINATION_CACHE_QUEUE)
        private readonly cacheQueue: Queue,
    ) {}

    async enqueueCacheData<T>(data: CacheJobData<T>) {
        await this.cacheQueue.add('pagination-cache', data, {
            removeOnComplete: true,
            removeOnFail: true,
        });
    }
}
