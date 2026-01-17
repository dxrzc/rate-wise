export const ITEMS_LIMITS = {
    TITLE: {
        MIN: 5,
        MAX: 40,
    },
    DESCRIPTION: {
        MIN: 5,
        MAX: 500,
    },
    CATEGORY: {
        MIN: 3,
        MAX: 40,
    },
    TAGS: {
        MAX_ARRAY_SIZE: 10,
        TAG_MIN_LENGTH: 2,
        TAG_MAX_LENGTH: 20,
    },
} as const;
