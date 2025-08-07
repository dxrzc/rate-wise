import { Request } from 'express';
import { ISessionData } from 'src/common/interfaces/cookies/session-data.interface';

export async function regenerateCookie(
    req: Request & { session: ISessionData },
    userID: string,
) {
    return new Promise<void>((resolve) => {
        req.session.regenerate((err) => {
            if (err) throw err;
            req.session.userId = userID;
            resolve();
        });
    });
}
