import { PaginationArgs } from 'src/common/dtos/args/pagination.args';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export type PaginationOptionsType<T extends ObjectLiteral> = PaginationArgs & {
    cache: boolean;
    qbModifier?: (qb: SelectQueryBuilder<T>) => SelectQueryBuilder<T>;
};
