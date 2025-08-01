export interface IUserDbRecord {
    created_at: Date;
    updated_at: Date;
    id: string;
    username: string;
    email: string;
    password: string;
    role: string;
    reputation_score: number;
    cursor: string;
}
