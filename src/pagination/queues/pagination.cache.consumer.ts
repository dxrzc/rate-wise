import { PAGINATION_CACHE_QUEUE } from '../constants/pagination.constants';
import { ICacheJobData } from '../interfaces/cache-job.data.interface';
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { SystemLogger } from 'src/common/logging/system.logger';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { Inject } from '@nestjs/common';
import { Job } from 'bullmq';

@Processor(PAGINATION_CACHE_QUEUE, { concurrency: 7 })
export class PaginationCacheConsumer extends WorkerHost {
    private readonly context = PaginationCacheConsumer.name;

    constructor(
        @Inject(CACHE_MANAGER)
        private readonly cacheManager: Cache,
    ) {
        super();
    }

    async process<T>(job: Job<ICacheJobData<T>>) {
        await this.cacheManager.set(job.data.key, job.data.value);
    }

    @OnWorkerEvent('completed')
    onCompleted(job: Job<ICacheJobData<unknown>>) {
        SystemLogger.getInstance().debug(`${job.data.key} record saved in cache`, this.context);
    }
}
