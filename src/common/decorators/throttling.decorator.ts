import { Throttle } from '@nestjs/throttler';
import { THROTTLE_CONFIG } from 'src/common/constants/throttle.config.constants';

export const UltraCriticalThrottle = () => Throttle({ default: THROTTLE_CONFIG.ULTRA_CRITICAL });

export const CriticalThrottle = () => Throttle({ default: THROTTLE_CONFIG.CRITICAL });

export const BalancedThrottle = () => Throttle({ default: THROTTLE_CONFIG.BALANCED });

export const RelaxedThrottle = () => Throttle({ default: THROTTLE_CONFIG.RELAXED });
