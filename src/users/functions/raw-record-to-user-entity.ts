import { IUserDbRecord } from '../interfaces/user-db-record.interface';
import { AccountStatus } from '../enums/account-status.enum';
import { UserRole } from '../enums/user-role.enum';
import { User } from '../entities/user.entity';

export function rawRecordTouserEntity(rawData: IUserDbRecord): User {
    return {
        createdAt: rawData.created_at,
        reputationScore: rawData.reputation_score,
        status: rawData.status as AccountStatus,
        updatedAt: rawData.updated_at,
        roles: rawData.roles as UserRole[],
        username: rawData.username,
        password: rawData.password,
        email: rawData.email,
        id: rawData.id,
    };
}
