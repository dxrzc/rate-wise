import { DatabaseError } from 'pg';
import { QueryFailedError } from 'typeorm';

export const isDuplicatedKeyError = (error: unknown): error is QueryFailedError<DatabaseError> => {
    if (!(error instanceof QueryFailedError)) return false;
    const driverError = error.driverError as { code?: string };
    return driverError?.code === '23505';
};
