import { isUUID } from 'class-validator';

export const validUUID = (id: string): boolean => isUUID(id);
