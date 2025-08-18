import { IBaseRawDbRecord } from 'src/common/interfaces/database/base-raw-db-record.interface';
import { User } from 'src/users/entities/user.entity';

export interface IItemDbRecord extends IBaseRawDbRecord {
    title: string;
    description: string;
    category: string;
    tags: string[];
    average_rating: number;
    review_count: number;
    user: User;
}
