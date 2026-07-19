import { ValueTransformer } from 'typeorm';

/**
 * Parses postgres array string into Javascript array and vice versa.
 * This is needed for custom domain types which don't automatically get parsed by TypeORM's default array handling.
 */
export const customArrayTransformer: ValueTransformer = {
    // When saving TO the database, pass the JS array as-is
    to: (value: string[] | null) => value,
    // When reading FROM the database, parse the raw Postgres string
    from: (value: string | string[] | null) => {
        if (!value) return [];
        if (Array.isArray(value)) return value;
        if (value === '{}') return [];
        // Strip the {} and split by comma
        // "{tagone,tagtwo}" -> ["tagone", "tagtwo"]
        return value
            .replace(/^{|}$/g, '')
            .split(',')
            .map((tag) => tag.replace(/^"|"$/g, '')); // Strip quotes if PG adds them
    },
};
