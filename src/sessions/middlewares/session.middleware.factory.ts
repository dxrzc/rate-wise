import { ServerConfigService } from 'src/config/services/server.config.service';
import { AuthConfigService } from 'src/config/services/auth.config.service';
import { REDIS_AUTH } from 'src/redis/constants/redis.constants';
import { Environment } from 'src/common/enum/environment.enum';
import { RedisService } from 'src/redis/redis.service';
import { Inject, Injectable } from '@nestjs/common';
import * as session from 'express-session';
import { RedisStore } from 'connect-redis';

@Injectable()
export class SessionMiddlewareFactory {
    constructor(
        @Inject(REDIS_AUTH)
        private readonly redis: RedisService,
        private readonly serverConfig: ServerConfigService,
        private readonly authConfig: AuthConfigService,
    ) {}

    create() {
        const middleware = session({
            name: this.authConfig.sessCookieName,
            resave: false,
            saveUninitialized: false,
            secret: this.authConfig.sessCookieSecret,
            unset: 'destroy',
            rolling: true,
            cookie: {
                httpOnly: true,
                maxAge: this.authConfig.sessCookieMaxAgeMs,
                secure: this.serverConfig.env === Environment.PRODUCTION,
            },
            store: new RedisStore({
                client: <unknown>this.redis.client,
                prefix: 'session:',
            }),
        });
        return middleware;
    }
}
