import { Response } from 'supertest';
import { testKit } from './test-kit.util';

/**
 * @param res response object
 * @returns boolean indicating if the session cookie was cleared in the response
 */
export function isSessionCookieCleared(res: Response): boolean {
    const setCookie = res.header['set-cookie'] as unknown as string[] | undefined;
    if (!setCookie) return false;
    const cookie = setCookie.find((c) => c.startsWith(`${testKit.authConfig.sessCookieName}=`));
    if (!cookie) return false;
    return /Expires=Thu, 01 Jan 1970 00:00:00 GMT/i.test(cookie);
}
