import { QueryFailedError } from 'typeorm';
import { DatabaseError } from 'pg';

export function getDuplicatedErrorKeyDetails(err: QueryFailedError<DatabaseError>): string {
    return err.driverError.detail || 'No duplicated error key details provided';
}
