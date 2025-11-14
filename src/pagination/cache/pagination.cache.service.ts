import { PAGINATION_MODULE_OPTIONS_TOKEN } from '../module/config.module-definition';
import { IPaginationModuleOptions } from '../interfaces/pagination.module-options.interface';
import { PAGINATION_CACHE_QUEUE } from '../constants/pagination.constants';
import { IDecodedCursor } from '../interfaces/decoded-cursor.interface';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { PaginatedRecord } from '../interfaces/base-record.data';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { BaseEntity } from 'src/common/entites/base.entity';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { encodeCursor } from '../functions/encode-cursor';
import { decodeCursor } from '../functions/decode-cursor';
import { InjectQueue } from '@nestjs/bullmq';
import { ModuleRef } from '@nestjs/core';
import { Queue } from 'bullmq';

@Injectable()
export class PaginationCacheService<T extends BaseEntity> implements OnModuleInit {
    private repository!: Repository<T>;

    constructor(
        @Inject(PAGINATION_MODULE_OPTIONS_TOKEN)
        private options: IPaginationModuleOptions<T>,
        @Inject(CACHE_MANAGER)
        private readonly cacheManager: Cache,
        @InjectQueue(PAGINATION_CACHE_QUEUE)
        private readonly cacheQuue: Queue,
        private moduleRef: ModuleRef,
    ) {}

    onModuleInit() {
        this.repository = this.moduleRef.get<Repository<T>>(this.options.repositoryToken, {
            strict: false,
        });
    }

    /**
     * Get the ids and cursors for the requested page
     */
    private async getPageIdsAndCursors(
        limit: number,
        decodedCursor?: IDecodedCursor,
    ): Promise<PaginatedRecord[]> {
        const pageIds = await this.repository
            .createQueryBuilder()
            .select('id')
            .addSelect('created_at::text', 'cursor')
            .where(decodedCursor ? '(created_at, id) > (:date, :id)' : 'TRUE', {
                date: decodedCursor?.createdAt,
                id: decodedCursor?.id,
            })
            .orderBy('created_at', 'ASC')
            .addOrderBy('id', 'ASC')
            .limit(limit + 1) // whether exists a next page or not
            .getRawMany<{ id: string; cursor: string }>();
        return pageIds.map(({ id, cursor }) => ({ id, cursor: encodeCursor(cursor, id) }));
    }

    /**
     * Attempt to get records from cache first and return an two arrays:
     * 1. results: array of records with using a null placeholder for not in cache
     * 2. idsNotInCache: array of ids not found in cache
     */
    private async getFromCache(idsForPage: PaginatedRecord[]) {
        const results = new Array<T | null>();
        const idsNotInCache = new Array<string>();
        for (const { id } of idsForPage) {
            const cached = await this.cacheManager.get<T>(this.options.createCacheKeyFunction(id));
            if (cached) {
                results.push(cached);
            } else {
                idsNotInCache.push(id);
                results.push(null); // placeholder
            }
        }
        return { results, idsNotInCache };
    }

    /**
     * Fetch records not found in cache from DB and return a map of [id, record]
     */
    private async fetchNotFoundRecords(idsNotFoundInCache: string[]): Promise<Map<string, T>> {
        const where = <FindOptionsWhere<T>>{ id: In(idsNotFoundInCache) };
        const dbRecords = await this.repository.findBy(where);
        return new Map(dbRecords.map((rec) => [rec.id, rec]));
    }

    async createPagination(limit: number, cursor: string) {
        const decodedCursor = cursor ? decodeCursor(cursor) : undefined;
        const idsAndCursorForPage = await this.getPageIdsAndCursors(limit, decodedCursor);
        // check whether has next page
        const hasNextPage = idsAndCursorForPage.length > limit;
        if (hasNextPage) idsAndCursorForPage.pop();
        // attempt to get from cache first
        const { results, idsNotInCache } = await this.getFromCache(idsAndCursorForPage);
        if (idsNotInCache.length > 0) {
            // fetch not found records from DB
            const fetchedRecords = await this.fetchNotFoundRecords(idsNotInCache);
            for (let i = 0; i < results.length; i++) {
                // replace null placeholders with fetched records
                if (results[i] === null) {
                    const { id } = idsAndCursorForPage[i];
                    const record = fetchedRecords.get(id)!;
                    results[i] = record;
                }
            }
            console.log({ fetchedRecords });
        }
        const fullResults = results as T[];
        const edges = fullResults.map((record, index) => ({
            cursor: encodeCursor(idsAndCursorForPage[index].cursor, record.id),
            node: record,
        }));
        return {
            totalCount: await this.repository.createQueryBuilder().getCount(),
            nodes: edges.map((edge) => edge.node),
            hasNextPage,
            edges,
        };
    }
}
