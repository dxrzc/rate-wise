import { ObjectLiteral, Repository } from 'typeorm';
import { IDecodedCursor } from 'src/common/interfaces/decoded-cursor.interface';
import { IEdgeType } from 'src/common/interfaces/edge-type.interface';
import { encodeCursor } from './encode-cursor';

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
>(
    repository: Repository<EntityType>,
    limit: number,
    transformFunction: (obj: RawRecord) => EntityType,
    decodedCursor?: IDecodedCursor,
): Promise<IEdgeType<EntityType>[]> {
    const rawData = await repository
        .createQueryBuilder()
        .select('*')
        .addSelect('created_at::text', 'cursor')
        .where(decodedCursor ? '(created_at, id) > (:date, :id)' : 'TRUE', {
            date: decodedCursor?.createdAt,
            id: decodedCursor?.id,
        })
        .orderBy('created_at', 'ASC')
        .addOrderBy('id', 'ASC')
        .limit(limit + 1)
        .getRawMany<RawRecord & { cursor: string }>();
    const transformedData = rawData.map((rawRecord) => ({
        node: transformFunction(rawRecord),
        cursor: encodeCursor(rawRecord.cursor, rawRecord.id),
    }));
    return transformedData;
}
