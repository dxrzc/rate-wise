import { User } from '../entities/user.entity';
import { IUserDbRecord } from '../interfaces/user-db-record.interface';

export function transformRawDbData(rawData: IUserDbRecord): User {
    return {
        createdAt: rawData.created_at,
        reputationScore: rawData.reputation_score,
        updatedAt: rawData.updated_at,
        role: rawData.role,
        username: rawData.username,
        password: rawData.password,
        email: rawData.email,
        id: rawData.id,
    };
}
