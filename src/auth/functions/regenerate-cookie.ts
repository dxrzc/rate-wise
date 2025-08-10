import { Request } from 'express';
import { RequestContext } from '../types/request-context.type';

/**
 *
 * @returns the session id
 */
export async function regenerateCookie(req: RequestContext, userID: string) {
    return new Promise<string>((resolve) => {
        req.session.regenerate((err) => {
            if (err) throw err;
            req.session.userId = userID;
            resolve(req.sessionID);
        });
    });
}
