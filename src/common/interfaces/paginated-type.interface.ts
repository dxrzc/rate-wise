import { IEdgeType } from './edge-type.interface';

export interface IPaginatedType<T> {
    edges: IEdgeType<T>[];
    nodes: T[];
    totalCount: number;
    hasNextPage: boolean;
}
