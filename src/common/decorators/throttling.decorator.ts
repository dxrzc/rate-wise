import { Throttle } from '@nestjs/throttler';
import { THROTTLE_CONFIG } from 'src/common/constants/throttle.config.constants';

export enum RateLimitTier {
    ULTRA_CRITICAL = 'ULTRA_CRITICAL',
    CRITICAL = 'CRITICAL',
    BALANCED = 'BALANCED',
    RELAXED = 'RELAXED',
}

export const RateLimit = (tier: RateLimitTier) => Throttle({ default: THROTTLE_CONFIG[tier] });
