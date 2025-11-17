import { PaginationArgs } from 'src/common/dtos/args/pagination.args';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export type QueryBuilder<T extends ObjectLiteral> = {
    sqbModifier: (qb: SelectQueryBuilder<T>) => SelectQueryBuilder<T>;
    sqbAlias: string;
};

export type PaginationOptionsType<T extends ObjectLiteral> = PaginationArgs & {
    cache: boolean;
    queryBuilder: QueryBuilder<T>;
};
