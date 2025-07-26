import { QueryFailedError } from 'typeorm';

export const isDuplicatedKeyError = (error: unknown) =>
    error instanceof QueryFailedError &&
    error.message.includes('duplicate key');
