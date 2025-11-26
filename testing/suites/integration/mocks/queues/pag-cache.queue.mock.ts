import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { TestingModule } from '@nestjs/testing';
import { PaginationCacheConsumer } from 'src/pagination/queues/pagination.cache.consumer';

export class PaginationCacheQueueMock {
    public paginationCacheConsumer!: PaginationCacheConsumer;

    createConsumer(testingModule: TestingModule) {
        const cacheManager = testingModule.get(CACHE_MANAGER);
        this.paginationCacheConsumer = new PaginationCacheConsumer(cacheManager);
    }

    async add(queueName: string, data: any) {
        if (!this.paginationCacheConsumer) {
            throw new Error('PaginationCacheConsumer not provided');
        }
        await this.paginationCacheConsumer.process({ data } as any);
    }
}
