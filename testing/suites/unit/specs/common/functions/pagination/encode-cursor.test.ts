import { encodeCursor } from 'src/common/functions/pagination/encode-cursor';

describe('encodeCursor', () => {
    test('encodes a cursor with createdAt and id', () => {
        const result = encodeCursor('2025-10-28T10:00:00Z', '123');
        const decoded = Buffer.from(result, 'base64').toString('utf-8');

        expect(decoded).toContain('"createdAt":"2025-10-28T10:00:00Z"');
        expect(decoded).toContain('"id":"123"');
    });

    test('return a valid base64 string', () => {
        const result = encodeCursor('2025-10-28T10:00:00Z', 'abc');
        expect(() => Buffer.from(result, 'base64').toString('utf-8')).not.toThrow();
    });

    test('produces deterministic output for same inputs', () => {
        const a = encodeCursor('2025-10-28', 'id1');
        const b = encodeCursor('2025-10-28', 'id1');
        expect(a).toBe(b);
    });

    test('produces different outputs for different inputs', () => {
        const a = encodeCursor('2025-10-28', 'id1');
        const b = encodeCursor('2025-10-28', 'id2');
        expect(a).not.toBe(b);
    });
});
