import { PaginationArgs } from 'src/common/dtos/args/pagination.args';
import { ObjectLiteral, SelectQueryBuilder } from 'typeorm';

export type QueryBuilder<T extends ObjectLiteral> = {
    readonly sqbModifier: (qb: SelectQueryBuilder<T>) => SelectQueryBuilder<T>;
    readonly sqbAlias: string;
};

export type PaginationOptionsType<T extends ObjectLiteral> = PaginationArgs & {
    readonly cache: boolean;
    readonly queryBuilder?: QueryBuilder<T>;
};
