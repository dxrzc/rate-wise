import { testKit } from './test-kit.util';
import { Response } from 'supertest';

/**
 * @param res response object
 * @returns For example:
 * "ssid=s%3AgJZiVfqhMS-bhSPRTgolavsZAIyMgJB9.%2BJHfLNoyfbacDNIs7NKs0pI1IcYN9HxrlAzI4qbd53M; Path=/; HttpOnly; Expires=Thu, 14 Aug 2025 16:43:30 GMT;"
 */
export function getSessionCookie(res: Response): string {
    const setCookieHeader = res.header['set-cookie'] as unknown as string[];
    const cookie = setCookieHeader.find(
        (c) => c.split('=')[0] === testKit.authConfig.sessCookieName,
    );
    if (!cookie) throw new Error('No session cookie found');
    return cookie;
}
