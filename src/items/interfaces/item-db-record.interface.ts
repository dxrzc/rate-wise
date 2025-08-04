import { IBaseRawDbRecord } from 'src/common/interfaces/base-raw-db-record.interface';

export interface IItemDbRecord extends IBaseRawDbRecord {
    title: string;
    description: string;
    category: string;
    tags: string[];
    average_rating: number;
    review_count: number;
}
