import {
    PAGINATION_CACHE_QUEUE,
    REPOSITORY_TOKEN,
    TRANSFORM_FUNCTION,
} from './constants/pagination.constants';
import { InjectQueue } from '@nestjs/bullmq';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { PaginatedRecord } from './interfaces/base-record.data';
import { IDecodedCursor } from './interfaces/decoded-cursor.interface';
import { PaginationOptionsType } from './types/pagination.options.type';
import { IPaginatedType } from './interfaces/paginated-type.interface';
import { IEdgeType } from './interfaces/edge-type.interface';
import { ObjectLiteral, Repository } from 'typeorm';
import { ModuleRef } from '@nestjs/core';
import { Queue } from 'bullmq';

@Injectable()
export class PaginationService<T extends ObjectLiteral> implements OnModuleInit {
    private repository!: Repository<T>;

    constructor(
        @Inject(TRANSFORM_FUNCTION)
        private readonly transformFunction: (rawRecord: ObjectLiteral) => T,
        @InjectQueue(PAGINATION_CACHE_QUEUE)
        private readonly cacheQuue: Queue,
        @Inject(REPOSITORY_TOKEN)
        private readonly repositoryToken: string,
        @Inject(CACHE_MANAGER)
        private readonly cacheManager: Cache,
        private moduleRef: ModuleRef,
    ) {}

    onModuleInit() {
        this.repository = this.moduleRef.get<Repository<T>>(this.repositoryToken, {
            strict: false,
        });
    }

    private decodeCursor(cursor: string): IDecodedCursor {
        const json = Buffer.from(cursor, 'base64').toString('utf-8');
        return JSON.parse(json) as IDecodedCursor;
    }

    private encodeCursor(createdAt: string, id: string): string {
        const json = JSON.stringify({ createdAt: createdAt, id });
        return Buffer.from(json).toString('base64');
    }

    private createEdges(rawData: PaginatedRecord[]): IEdgeType<T>[] {
        const edges = rawData.map((rawRecord) => ({
            cursor: this.encodeCursor(rawRecord.cursor, rawRecord.id),
            node: this.transformFunction(rawRecord),
        }));
        return edges;
    }

    private async createPages(edges: IEdgeType<T>[], limit: number): Promise<IPaginatedType<T>> {
        const hasNextPage = edges.length > limit;
        if (hasNextPage) edges.pop();
        return {
            totalCount: await this.repository.createQueryBuilder().getCount(),
            nodes: edges.map((edge) => edge.node),
            hasNextPage,
            edges,
        };
    }

    // No cache version
    private async createPagination(limit: number, cursor: string): Promise<IPaginatedType<T>> {
        const decodedCursor = cursor ? this.decodeCursor(cursor) : undefined;
        const rawData = await this.repository
            .createQueryBuilder()
            .select('*')
            .addSelect('created_at::text', 'cursor')
            .where(decodedCursor ? '(created_at, id) > (:date, :id)' : 'TRUE', {
                date: decodedCursor?.createdAt,
                id: decodedCursor?.id,
            })
            .orderBy('created_at', 'ASC')
            .addOrderBy('id', 'ASC')
            .limit(limit + 1) // whether exists a next page or not
            .getRawMany<PaginatedRecord>();
        const edges = this.createEdges(rawData);
        return await this.createPages(edges, limit);
    }

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
        return pageIds.map(({ id, cursor }) => ({ id, cursor: this.encodeCursor(cursor, id) }));
    }

    // private async createPaginationCached(limit: number, cursor: string) {
    //     const decodedCursor = cursor ? this.decodeCursor(cursor) : undefined;
    //     const pageIds = await this.getPageIdsAndCursors(limit, decodedCursor);
    //     console.log({ pageIds });
    // }

    async create(options: PaginationOptionsType): Promise<IPaginatedType<T>> {
        return await this.createPagination(options.limit, options.cursor);
    }
}
