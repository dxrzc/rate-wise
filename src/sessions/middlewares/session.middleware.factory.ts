import { REDIS_AUTH } from 'src/redis/constants/redis.constants';
import { RedisService } from 'src/redis/redis.service';
import { Inject, Injectable } from '@nestjs/common';
import * as session from 'express-session';
import { RedisStore } from 'connect-redis';
import { ISessionsOptions } from '../interfaces/sessions.options.interface';
import { SESSION_OPTIONS } from '../constants/sessions.constants';

@Injectable()
export class SessionMiddlewareFactory {
    constructor(
        @Inject(REDIS_AUTH) private readonly redis: RedisService,
        @Inject(SESSION_OPTIONS) private sessionOptions: ISessionsOptions,
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
                client: <unknown>this.redis.client,
                prefix: 'session:',
            }),
        });
        return middleware;
    }
}
