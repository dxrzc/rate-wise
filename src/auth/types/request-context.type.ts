import { Request } from 'express';
import { ISessionData } from '../interfaces/session-data.interface';
import { AuthenticatedUser } from 'src/common/interfaces/user/authenticated-user.interface';

/**
 * Defines the request object with authentiuser data and session
 */
export type RequestContext = Request & {
    readonly session: ISessionData; // express-session
} & {
    readonly user: AuthenticatedUser; // AuthGuard
};
