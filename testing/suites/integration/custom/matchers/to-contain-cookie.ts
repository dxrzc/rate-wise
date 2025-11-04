import type { MatcherFunction } from 'expect';
import type { Response } from 'supertest';

export const toContainCookie: MatcherFunction<[cookie: string]> = function (
    response: unknown,
    cookieName: string,
) {
    const typedRes = response as Response;
    const cookies = typedRes.headers['set-cookie'] as unknown as string[];

    if (!cookies) {
        return {
            pass: false,
            message: () => `Expected response to have a 'Set-Cookie' header, but none was found.`,
        };
    }

    const cookie = cookies.find((c) => c.split('=')[0] === cookieName);
    const pass = Boolean(cookie);

    return {
        pass,
        message: () =>
            pass
                ? `Expected response not to contain cookie '${cookieName}', but it was found.`
                : `Expected response to contain cookie '${cookieName}', but it was not found.`,
    };
};
