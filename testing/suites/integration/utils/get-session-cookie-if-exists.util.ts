import { Response } from 'supertest';
import { testKit } from './test-kit.util';

/**
 * @param res response object
 * @returns The session cookie if found, otherwise, null
 */
export function getSessionCookieIfExists(res: Response): string | null {
    const setCookieHeader = res.header['set-cookie'] as unknown as string[];
    const cookie = setCookieHeader.find(
        (c) => c.split('=')[0] === testKit.authConfig.sessCookieName,
    );
    if (!cookie) return null;
    return cookie;
}
