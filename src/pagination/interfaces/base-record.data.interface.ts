export interface PaginatedRecord {
    id: string;
    cursor: string; // createdAt value used for pagination cursor
}
