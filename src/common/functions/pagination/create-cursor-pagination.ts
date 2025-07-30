import { encodeCursor } from './encode-cursor';
import { ObjectLiteral, Repository } from 'typeorm';
import { IDecodedCursor } from 'src/common/interfaces/decoded-cursor.interface';

export async function createCursorPagination<
    T extends ObjectLiteral,
    RawRecord extends { id: string },
>(repository: Repository<T>, limit: number, decodedCursor?: IDecodedCursor) {
    const rawData = await repository
        .createQueryBuilder()
        .select('*')
        .addSelect('created_at::text', 'cursor')
        .where(decodedCursor ? '(created_at, id) >= (:date, :id)' : 'TRUE', {
            date: decodedCursor?.createdAt,
            id: decodedCursor?.id,
        })
        .orderBy('created_at', 'ASC')
        .addOrderBy('id', 'ASC')
        .limit(limit + 1)
        .getRawMany<RawRecord & { cursor: string }>();

    const lastRecord = rawData.at(-1);
    if (!lastRecord) return { rawData: [], nextCursor: null };

    const nextCursor = encodeCursor(lastRecord.cursor, lastRecord.id);
    rawData.pop();
    return { rawData, nextCursor };
}
