import { Request } from 'express';
import { ISessionData } from '../interfaces/session-data.interface';

export type RequestContext = Request & { session: ISessionData };
