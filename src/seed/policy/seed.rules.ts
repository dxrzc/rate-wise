import { ISeedOptions } from '../interfaces/seed-options.interface';

export const SEED_RULES: ISeedOptions = {
    USERS: 8,
    ITEMS_PER_USER: 2,
    MAX_REVIEWS: 5,
    MAX_VOTES: 5,
} as const;
