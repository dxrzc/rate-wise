import { SESS_REDIS_PREFIX } from '../constants/sessions.constants';

export const sessionKey = (sessId: string) => `${SESS_REDIS_PREFIX}${sessId}`;
