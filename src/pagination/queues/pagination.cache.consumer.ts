import { PAGINATION_CACHE_QUEUE } from '../constants/pagination.constants';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { SystemLogger } from 'src/common/logging/system.logger';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { CacheJobData } from '../types/cache-job.data.type';
import { Inject } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor(PAGINATION_CACHE_QUEUE, { concurrency: 5 })
export class PaginationCacheConsumer extends WorkerHost {
    private readonly context = PaginationCacheConsumer.name;

    constructor(
        @Inject(CACHE_MANAGER)
        private readonly cacheManager: Cache,
    ) {
        super();
    }

    async process<T>(job: Job<CacheJobData<T>>) {
        await this.cacheManager.mset(job.data);
    }

    @OnWorkerEvent('active')
    onActive(job: Job<CacheJobData<CacheJobData<unknown>>>) {
        const total = job.data.length;
        SystemLogger.getInstance().debug(`Saving ${total} records in cache`, this.context);
    }

    @OnWorkerEvent('completed')
    onCompleted(job: Job<CacheJobData<CacheJobData<unknown>>>) {
        const total = job.data.length;
        SystemLogger.getInstance().debug(`${total} records saved in cache`, this.context);
    }
}
