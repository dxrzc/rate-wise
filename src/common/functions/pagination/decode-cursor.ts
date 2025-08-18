import { IDecodedCursor } from 'src/common/interfaces/pagination/decoded-cursor.interface';

export function decodeCursor(cursor: string): IDecodedCursor {
    const json = Buffer.from(cursor, 'base64').toString('utf-8');
    return JSON.parse(json) as IDecodedCursor;
}
