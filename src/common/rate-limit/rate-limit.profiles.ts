import { minutes } from '@nestjs/throttler';

export const RATE_LIMIT_PROFILES = {
    ULTRA_CRITICAL: { limit: 3, ttl: minutes(20) },
    CRITICAL: { limit: 3, ttl: minutes(1) },
    BALANCED: { limit: 100, ttl: minutes(1) },
    RELAXED: { limit: 1000, ttl: minutes(1) },
} as const;
