import { IPaginationOptions } from './config/pagination.options';
import { runSettledOrThrow } from 'src/common/utils/run-settled-or-throw.util';
import { PAGINATION_MODULE_OPTIONS_TOKEN } from './config/config.module-definition';
import { CreatePagination, QueryBuilder } from './types/create-pagination.type';
import { PaginationCacheProducer } from './queues/pagination-cache.producer';
import { IDecodedCursor } from './interfaces/decoded-cursor.interface';
import { IPaginatedType } from './interfaces/paginated-type.interface';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { PaginatedRecord } from './interfaces/base-record.data.interface';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { IEdgeType } from './interfaces/edge-type.interface';
import { BaseEntity } from 'src/common/entites/base.entity';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { encodeCursor } from './cursor/encode-cursor';
import { decodeCursor } from './cursor/decode-cursor';
import { ModuleRef } from '@nestjs/core';

@Injectable()
export class PaginationService<T extends BaseEntity> implements OnModuleInit {
    private repository!: Repository<T>;

    constructor(
        @Inject(PAGINATION_MODULE_OPTIONS_TOKEN)
        private readonly options: IPaginationOptions,
        @Inject(CACHE_MANAGER)
        private readonly cacheManager: Cache,
        private readonly cacheProducer: PaginationCacheProducer,
        private readonly moduleRef: ModuleRef,
    ) {}

    onModuleInit() {
        this.repository = this.moduleRef.get<Repository<T>>(this.options.repositoryToken, {
            strict: false,
        });
    }

    /**
     * Fetch totalCount + sorted ids concurrently.
     */
    private async getPageAndTotalCount(
        limit: number,
        decodedCursor?: IDecodedCursor,
        queryBuilder?: QueryBuilder<T>,
    ): Promise<{ totalCount: number; page: PaginatedRecord[] }> {
        let countQuery = this.repository.createQueryBuilder().getCount();
        if (queryBuilder) {
            let cqb = this.repository.createQueryBuilder(queryBuilder.sqbAlias);
            cqb = queryBuilder.sqbModifier(cqb);
            countQuery = cqb.getCount();
        }
        const [totalCount, sortedIdsAndCursors] = await runSettledOrThrow<
            [number, PaginatedRecord[]]
        >([countQuery, this.getPageIdsAndEncodedCursors(limit, decodedCursor, queryBuilder)]);
        return { totalCount, page: sortedIdsAndCursors };
    }

    /**
     * Retrieves sorted IDs + encoded cursor.
     * LIMIT+1 is required to detect hasNextPage.
     */
    private async getPageIdsAndEncodedCursors(
        limit: number,
        decodedCursor?: IDecodedCursor,
        queryBuilder?: QueryBuilder<T>,
    ): Promise<PaginatedRecord[]> {
        const qbAlias = queryBuilder?.sqbAlias || 'e';

        let qb = this.repository.createQueryBuilder(qbAlias);
        qb = qb.select(`${qbAlias}.id`, 'id').addSelect(`${qbAlias}.created_at::text`, 'cursor');
        if (queryBuilder) {
            // apply caller's modifier (joins, filters, etc...)
            qb = queryBuilder.sqbModifier(qb);
        }
        if (decodedCursor) {
            qb = qb.andWhere(`(${qbAlias}.createdAt, ${qbAlias}.id) > (:date, :id)`, {
                date: decodedCursor.createdAt,
                id: decodedCursor.id,
            });
        }
        qb = qb
            .orderBy(`${qbAlias}.createdAt`, 'ASC')
            .addOrderBy(`${qbAlias}.id`, 'ASC')
            .limit(limit + 1);
        const idsAndCursors = await qb.getRawMany<{ id: string; cursor: string }>();
        return idsAndCursors.map(({ id, cursor }) => ({ id, cursor: encodeCursor(cursor, id) }));
    }

    /**
     * Fetch DB records for the provided IDs.
     * Order is NOT guaranteed; caller must sort using the ids array.
     */
    private async fetchRecords(ids: string[]): Promise<Map<string, T>> {
        const where = <FindOptionsWhere<T>>{ id: In(ids) };
        const dbRecords = await this.repository.findBy(where);
        return new Map(dbRecords.map((rec) => [rec.id, rec]));
    }

    /**
     * Attempt to get records from cache first and return an two arrays:
     * 1. results: array of records with using a null placeholder for not in cache
     * 2. idsNotInCache: array of ids not found in cache
     */
    private async getFromCache(page: PaginatedRecord[]) {
        const idsForPage = page.map((p) => p.id);
        const cacheKeys = idsForPage.map((id) => this.options.createCacheKeyFunction(id));
        const cachedValues = await this.cacheManager.mget<T>(cacheKeys);

        const idsNotInCache: string[] = [];
        const results: (T | null)[] = [];

        for (let i = 0; i < idsForPage.length; i++) {
            const cached = cachedValues[i];
            if (cached === undefined) {
                idsNotInCache.push(idsForPage[i]);
                results.push(null);
            } else {
                results.push(cached);
            }
        }
        return { results, idsNotInCache };
    }

    async createPaginationCached(
        limit: number,
        cursor?: string,
        queryBuilder?: QueryBuilder<T>,
    ): Promise<IPaginatedType<T>> {
        const decodedCursor = cursor ? decodeCursor(cursor) : undefined;
        const { totalCount, page } = await this.getPageAndTotalCount(
            limit,
            decodedCursor,
            queryBuilder,
        );
        // determine if there is a next page
        const hasNextPage = page.length > limit;
        if (hasNextPage) page.pop();
        // attempt to get from cache first
        const { results, idsNotInCache } = await this.getFromCache(page);
        if (idsNotInCache.length > 0) {
            // fetch not found records from DB
            const fetchedRecordsMap = await this.fetchRecords(idsNotInCache);
            for (let i = 0; i < results.length; i++) {
                // replace null placeholders with fetched records
                if (results[i] === null) {
                    const { id } = page[i];
                    const entity = fetchedRecordsMap.get(id)!;
                    results[i] = entity;
                }
            }
            // enqueue cache jobs
            for (const record of Array.from(fetchedRecordsMap.values())) {
                await this.cacheProducer.enqueueCacheData({
                    key: this.options.createCacheKeyFunction(record.id),
                    value: record,
                });
            }
        }
        const fullResults = results as T[];
        const edges = fullResults.map((record, index) => ({
            cursor: page[index].cursor,
            node: record,
        }));
        return {
            totalCount,
            nodes: edges.map((edge) => edge.node),
            hasNextPage,
            edges,
        };
    }

    // No cache version
    private async createPagination(
        limit: number,
        cursor?: string,
        queryBuilder?: QueryBuilder<T>,
    ): Promise<IPaginatedType<T>> {
        const decodedCursor = cursor ? decodeCursor(cursor) : undefined;
        const { totalCount, page } = await this.getPageAndTotalCount(
            limit,
            decodedCursor,
            queryBuilder,
        );
        // determine if there is a next page
        const hasNextPage = page.length > limit;
        if (hasNextPage) page.pop();
        // fetch the records (unordered)
        const sortedIds = page.map(({ id }) => id);
        const idRecordMap = await this.fetchRecords(sortedIds); // returns Map<id, record> in random order
        // rebuild records in the correct sorted order
        const entities = page.map(({ id }) => idRecordMap.get(id)!);
        // build edges
        const edges: IEdgeType<T>[] = entities.map((record, index) => ({
            cursor: page[index].cursor,
            node: record,
        }));
        // total count
        return {
            totalCount,
            nodes: entities,
            hasNextPage,
            edges,
        };
    }

    /**
     * By default performs a "SELECT *" in the repository table and counts all the records.
     * - Provide a custom query builder to modify the query (joins, filters, etc...).
     * @param options Pagination options.
     * @returns edges, nodes, totalCount and hasNextPage.
     */
    async create(options: CreatePagination<T>): Promise<IPaginatedType<T>> {
        return options.cache
            ? await this.createPaginationCached(options.limit, options.cursor, options.queryBuilder)
            : await this.createPagination(options.limit, options.cursor, options.queryBuilder);
    }
}
