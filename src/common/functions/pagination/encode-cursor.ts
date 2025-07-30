export function encodeCursor(createdAt: string, id: string): string {
    const json = JSON.stringify({ createdAt: createdAt, id });
    return Buffer.from(json).toString('base64');
}
