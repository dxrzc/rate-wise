import { IEdgeType } from './edge-type.interface';

export interface IPaginatedType<T> {
    readonly edges: IEdgeType<T>[];
    readonly nodes: T[];
    readonly totalCount: number;
    readonly hasNextPage: boolean;
}
