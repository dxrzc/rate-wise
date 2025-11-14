import { IPaginationModuleOptions } from './interfaces/pagination.module-options.interface';
import { PAGINATION_MODULE_OPTIONS_TOKEN } from './module/config.module-definition';
import { PaginationCacheService } from './cache/pagination.cache.service';
import { PaginationOptionsType } from './types/pagination.options.type';
import { IPaginatedType } from './interfaces/paginated-type.interface';
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { PaginatedRecord } from './interfaces/base-record.data';
import { IEdgeType } from './interfaces/edge-type.interface';
import { BaseEntity } from 'src/common/entites/base.entity';
import { encodeCursor } from './functions/encode-cursor';
import { decodeCursor } from './functions/decode-cursor';
import { ModuleRef } from '@nestjs/core';
import { Repository } from 'typeorm';

@Injectable()
export class PaginationService<T extends BaseEntity> implements OnModuleInit {
    private repository!: Repository<T>;

    constructor(
        @Inject(PAGINATION_MODULE_OPTIONS_TOKEN)
        private readonly options: IPaginationModuleOptions<T>,
        private readonly paginationCacheSvc: PaginationCacheService<T>,
        private readonly moduleRef: ModuleRef,
    ) {}

    onModuleInit() {
        this.repository = this.moduleRef.get<Repository<T>>(this.options.repositoryToken, {
            strict: false,
        });
    }

    private createEdges(rawData: PaginatedRecord[]): IEdgeType<T>[] {
        const edges = rawData.map((rawRecord) => ({
            cursor: encodeCursor(rawRecord.cursor, rawRecord.id),
            node: this.options.transformFunction(rawRecord),
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

    private async createPagination(limit: number, cursor: string): Promise<IPaginatedType<T>> {
        const decodedCursor = cursor ? decodeCursor(cursor) : undefined;
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

    async create(options: PaginationOptionsType): Promise<IPaginatedType<T>> {
        return options.cache
            ? await this.paginationCacheSvc.createPagination(options.limit, options.cursor)
            : await this.createPagination(options.limit, options.cursor);
    }
}
