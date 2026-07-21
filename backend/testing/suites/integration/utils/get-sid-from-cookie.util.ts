import { extractSessionIdFromCookie } from '@testing/tools/utils/get-sid-from-cookie.util';

export function getSidFromCookie(rawSessionCookie: string): string {
    return extractSessionIdFromCookie(rawSessionCookie);
}
