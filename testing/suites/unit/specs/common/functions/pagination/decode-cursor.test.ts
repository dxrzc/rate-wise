import { decodeCursor } from 'src/pagination/functions/decode-cursor';
import { encodeCursor } from 'src/pagination/functions/encode-cursor';

interface IDecodedCursor {
    createdAt: string;
    id: string;
}

describe('decodeCursor', () => {
    test('decodes a valid base64 cursor string', () => {
        const cursor = encodeCursor('2025-10-28T10:00:00Z', 'xyz');
        const decoded = decodeCursor(cursor);

        expect(decoded).toEqual({
            createdAt: '2025-10-28T10:00:00Z',
            id: 'xyz',
        });
    });

    test('throws when cursor is not valid base64', () => {
        expect(() => decodeCursor('invalid-base64')).toThrow();
    });

    test('throws when decoded string is not valid JSON', () => {
        const badCursor = Buffer.from('not-json').toString('base64');
        expect(() => decodeCursor(badCursor)).toThrow();
    });

    test('round-trip: encode → decode → original', () => {
        const input: IDecodedCursor = {
            createdAt: '2025-10-28T15:30:00Z',
            id: 'cursor-42',
        };

        const encoded = encodeCursor(input.createdAt, input.id);
        const decoded = decodeCursor(encoded);

        expect(decoded).toEqual(input);
    });
});
