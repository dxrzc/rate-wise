import { IUserDbRecord } from '../interfaces/user-db-record.interface';
import { UserStatus } from '../enum/user-status.enum';
import { UserRole } from '../enum/user-role.enum';
import { User } from '../entities/user.entity';

export function rawRecordTouserEntity(rawData: IUserDbRecord): User {
    return {
        createdAt: rawData.created_at,
        reputationScore: rawData.reputation_score,
        status: rawData.status as UserStatus,
        updatedAt: rawData.updated_at,
        role: rawData.role as UserRole,
        username: rawData.username,
        password: rawData.password,
        email: rawData.email,
        id: rawData.id,
    };
}
