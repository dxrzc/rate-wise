import { PAGINATION_CACHE_QUEUE } from '../constants/pagination.constants';
import { ICacheJobData } from '../interfaces/cache-job.data.interface';
import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class PaginationCacheProducer {
    constructor(
        @InjectQueue(PAGINATION_CACHE_QUEUE)
        private readonly cacheQueue: Queue,
    ) {}

    async enqueueCacheData<T>(data: ICacheJobData<T>) {
        await this.cacheQueue.add('save-data', data, {
            removeOnComplete: true,
            removeOnFail: true,
            jobId: data.key,
        });
    }
}
