export function parseArrayLike<T>(value: string): T[] {
    const inner = value.trim().replace(/^(\[|\{)|(\]|\})$/g, '');
    if (!inner) return [];
    return <T[]>inner
        .split(',')
        .map(
            (v) =>
                v
                    .trim() // remove spaces
                    .replace(/^"|"$/g, '') // remove surrounding double quotes
                    .replace(/^'|'$/g, ''), // remove surrounding single quotes
        )
        .filter(Boolean);
}
