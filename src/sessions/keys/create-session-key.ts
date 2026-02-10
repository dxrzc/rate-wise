import { SESS_REDIS_PREFIX } from '../di/sessions.providers';

export const createSessionKey = (sessId: string) => `${SESS_REDIS_PREFIX}${sessId}`;
