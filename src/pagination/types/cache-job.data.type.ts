export type RecordData<T> = {
    key: string;
    value: T;
};
export type CacheJobData<T> = RecordData<T>[];
