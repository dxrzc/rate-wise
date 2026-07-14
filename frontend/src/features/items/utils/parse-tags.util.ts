export function parseTags(raw: string): string[] {
    return raw
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean);
}
