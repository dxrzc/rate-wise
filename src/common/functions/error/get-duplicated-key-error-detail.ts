import { QueryFailedError } from 'typeorm';

export function getDuplicatedErrorKeyDetail(err: unknown): string {
    const driverError = (err as QueryFailedError).driverError as unknown as {
        detail: string;
    };
    return driverError.detail;
}
