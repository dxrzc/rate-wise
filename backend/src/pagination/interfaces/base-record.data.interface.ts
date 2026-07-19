export interface PaginatedRecord {
    readonly id: string;
    readonly cursor: string; // createdAt value used for pagination cursor
}
