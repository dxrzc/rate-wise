import { ISessionsModuleOptions } from '../interface/sessions-module-options.interface';
import { REDIS_SESSIONS_CLIENT } from '../constants/redis-sess-client.token.constant';
import { SESS_MODULE_OPTS } from '../constants/sess-module-opts.token.constant';
import { ServerConfigService } from 'src/config/services/server.config.service';
import { RedisAdapter } from 'src/common/redis/redis.adapter';
import { Environment } from 'src/common/enum/environment.enum';
import { Inject, Injectable } from '@nestjs/common';
import * as session from 'express-session';
import { RedisStore } from 'connect-redis';

@Injectable()
export class SessionMiddlewareFactory {
    constructor(
        private readonly serverConfig: ServerConfigService,
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
                secure: this.serverConfig.env === Environment.PRODUCTION,
            },
            store: new RedisStore({
                client: this.redis.client,
                prefix: 'session:',
            }),
        });
        return middleware;
    }
}
