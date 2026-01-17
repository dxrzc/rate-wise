import { Request } from 'express';
import { ISessionData } from '../interfaces/session-data.interface';
import { AuthenticatedUser } from 'src/common/interfaces/user/authenticated-user.interface';

export type RequestContext = Request & { session: ISessionData } & {
    readonly user: AuthenticatedUser;
};
