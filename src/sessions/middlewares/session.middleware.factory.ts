import { ISessionsModuleOptions } from '../interface/sessions-module-options.interface';
import { REDIS_SESSIONS_CLIENT } from '../constants/redis-sess-client.token.constant';
import { SESS_MODULE_OPTS } from '../constants/sess-module-opts.token.constant';
import { RedisAdapter } from 'src/common/redis/redis.adapter';
import { Inject, Injectable } from '@nestjs/common';
import * as session from 'express-session';
import { RedisStore } from 'connect-redis';

@Injectable()
export class SessionMiddlewareFactory {
    constructor(
        @Inject(REDIS_SESSIONS_CLIENT)
        private readonly redis: RedisAdapter,
        @Inject(SESS_MODULE_OPTS)
        private readonly sessOpts: ISessionsModuleOptions,
    ) {}

    create() {
        const middleware = session({
            name: this.sessOpts.cookieName,
            resave: false,
            saveUninitialized: false,
            secret: this.sessOpts.cookieSecret,
            unset: 'destroy',
            rolling: true,
            cookie: {
                httpOnly: true,
                maxAge: this.sessOpts.cookieMaxAgeMs,
                secure: this.sessOpts.secure,
            },
            store: new RedisStore({
                client: <unknown>this.redis.client,
                prefix: 'session:',
            }),
        });
        return middleware;
    }
}
