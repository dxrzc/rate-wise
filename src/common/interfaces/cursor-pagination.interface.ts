export interface ICursorPagination<T> {
    data: T[];
    nextCursor?: string;
}
