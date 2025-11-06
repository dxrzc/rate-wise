import { ObjectLiteral } from 'typeorm';
import { IEdgeType } from 'src/common/interfaces/pagination/edge-type.interface';
import { encodeCursor } from './encode-cursor';
import { PaginationEdgesFactoryOptions } from 'src/common/types/pagination/pagination-edges-factory.options';
/**
 * Returns every record and its cursor. The cursor is the "created_at" and "id" values encoded in base64
 * @param repository Instance of "Repository" (typeorm)
 * @param limit Max records. Even though an extra recorded is fetched in order to calculate "hasNextPage"
 * @param transformFunction Takes a db record (in snake_case) and transforms into camel version
 * @param decodedCursor Object contaning "created_at" and "id" values
 * @returns Array of nodes and their respectively cursors
 */
export async function createPaginationEdges<
    EntityType extends ObjectLiteral,
    RawRecord extends { id: string },
>(opts: PaginationEdgesFactoryOptions<EntityType, RawRecord>): Promise<IEdgeType<EntityType>[]> {
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
        cursor: encodeCursor(rawRecord.cursor, rawRecord.id),
    }));
    return transformedData;
}
