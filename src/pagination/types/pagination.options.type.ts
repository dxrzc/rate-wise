import { PaginationArgs } from 'src/common/dtos/args/pagination.args';

export type PaginationOptionsType = PaginationArgs & {
    cache: boolean;
};
