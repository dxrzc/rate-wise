import { Throttle } from '@nestjs/throttler';
import { RATE_LIMIT_PROFILES } from 'src/common/rate-limit/rate-limit.profiles';

export enum RateLimitTier {
    ULTRA_CRITICAL = 'ULTRA_CRITICAL',
    CRITICAL = 'CRITICAL',
    BALANCED = 'BALANCED',
    RELAXED = 'RELAXED',
}

export const RateLimit = (tier: RateLimitTier) => Throttle({ default: RATE_LIMIT_PROFILES[tier] });
