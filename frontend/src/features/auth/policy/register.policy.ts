export const REGISTER_POLICY = {
    USERNAME: {
        MIN: 3,
        MAX: 30,
    },
    PASSWORD: {
        MIN: 8,
        MAX: 60,
    },
} as const;
