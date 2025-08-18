import { User } from '../entities/user.entity';
import { UserRole } from '../enum/user-role.enum';
import { IUserDbRecord } from '../interfaces/user-db-record.interface';

export function rawRecordTouserEntity(rawData: IUserDbRecord): User {
    return {
        createdAt: rawData.created_at,
        reputationScore: rawData.reputation_score,
        updatedAt: rawData.updated_at,
        role: rawData.role as UserRole,
        username: rawData.username,
        password: rawData.password,
        email: rawData.email,
        id: rawData.id,
    };
}
