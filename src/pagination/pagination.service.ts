import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { IDecodedCursor } from './interfaces/decoded-cursor.interface';
import { ObjectLiteral } from 'typeorm';
import { PaginationEdgesFactoryOptions } from 'src/common/types/pagination/pagination-edges-factory.options';
import { IEdgeType } from './interfaces/edge-type.interface';
import { InjectQueue } from '@nestjs/bullmq';
import { PAGINATION_CACHE_QUEUE } from './constants/pagination.constants';
import { Queue } from 'bullmq';

@Injectable()
export class PaginationService {
    constructor(
        @InjectQueue(PAGINATION_CACHE_QUEUE)
        private readonly cacheQuue: Queue,
        @Inject(CACHE_MANAGER)
        private readonly cacheManager: Cache,
    ) {}

    private decodeCursor(cursor: string): IDecodedCursor {
        const json = Buffer.from(cursor, 'base64').toString('utf-8');
        return JSON.parse(json) as IDecodedCursor;
    }

    private encodeCursor(createdAt: string, id: string): string {
        const json = JSON.stringify({ createdAt: createdAt, id });
        return Buffer.from(json).toString('base64');
    }
    /**
     * Returns every record and its cursor. The cursor is the "created_at" and "id" values encoded in base64
     * @param repository Instance of "Repository" (typeorm)
     * @param limit Max records. Even though an extra recorded is fetched in order to calculate "hasNextPage"
     * @param transformFunction Takes a db record (in snake_case) and transforms into camel version
     * @param decodedCursor Object contaning "created_at" and "id" values
     * @returns Array of nodes and their respectively cursors
     */
    async createPaginationEdges<EntityType extends ObjectLiteral, RawRecord extends { id: string }>(
        opts: PaginationEdgesFactoryOptions<EntityType, RawRecord>,
    ): Promise<IEdgeType<EntityType>[]> {
        const rawData = await opts.repository
            .createQueryBuilder()
            .select('*')
            .addSelect('created_at::text', 'cursor')
            .where(opts.decodedCursor ? '(created_at, id) > (:date, :id)' : 'TRUE', {
                date: opts.decodedCursor?.createdAt,
                id: opts.decodedCursor?.id,
            })
            .orderBy('created_at', 'ASC')
            .addOrderBy('id', 'ASC')
            .limit(opts.limit + 1)
            .getRawMany<RawRecord & { cursor: string }>();
        const transformedData = rawData.map((rawRecord) => ({
            node: opts.transformFunction(rawRecord),
            cursor: this.encodeCursor(rawRecord.cursor, rawRecord.id),
        }));
        return transformedData;
    }
}
