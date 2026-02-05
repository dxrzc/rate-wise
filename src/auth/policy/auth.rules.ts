export const AUTH_RULES = {
    USERNAME: {
        MIN: 3,
        MAX: 30,
    },
    PASSWORD: {
        MIN: 8,
        MAX: 60,
    },
    EMAIL: {
        MAX: 254,
    },
} as const;
