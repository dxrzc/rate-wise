import { IBaseRawDbRecord } from 'src/common/interfaces/base-raw-db-record.interface';

export interface IUserDbRecord extends IBaseRawDbRecord {
    username: string;
    email: string;
    password: string;
    role: string;
    reputation_score: number;
    cursor: string;
}
