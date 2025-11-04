import { Inject, Injectable } from '@nestjs/common';
import * as session from 'express-session';
import { RedisStore } from 'connect-redis';
import { ISessionsRootOptions } from '../interfaces/sessions.root.options.interface';
import {
    SESSIONS_ROOT_OPTIONS,
    SESSIONS_REDIS_CONNECTION,
    SESS_REDIS_PREFIX,
} from '../constants/sessions.constants';
import { RedisClientAdapter } from 'src/common/redis/redis.client.adapter';

@Injectable()
export class SessionMiddlewareFactory {
    constructor(
        @Inject(SESSIONS_ROOT_OPTIONS)
        private sessionOptions: ISessionsRootOptions,
        @Inject(SESSIONS_REDIS_CONNECTION)
        private readonly redisClient: RedisClientAdapter,
    ) {}

    create() {
        const middleware = session({
            name: this.sessionOptions.cookieName,
            resave: false,
            saveUninitialized: false,
            secret: this.sessionOptions.cookieSecret,
            unset: 'destroy',
            rolling: true,
            cookie: {
                httpOnly: true,
                maxAge: this.sessionOptions.cookieMaxAgeMs,
                secure: this.sessionOptions.secure,
            },
            store: new RedisStore({
                client: <unknown>this.redisClient.connection.client,
                prefix: SESS_REDIS_PREFIX,
            }),
        });
        return middleware;
    }
}
