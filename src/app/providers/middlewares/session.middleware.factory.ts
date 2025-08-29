import { ServerConfigService } from 'src/config/services/server.config.service';
import { AuthConfigService } from 'src/config/services/auth.config.service';
import { Environment } from 'src/common/enum/environment.enum';
import { RedisService } from 'src/redis/redis.service';
import { Injectable } from '@nestjs/common';
import * as session from 'express-session';
import { RedisStore } from 'connect-redis';

@Injectable()
export class SessionMiddlewareFactory {
    constructor(
        private readonly redisService: RedisService,
        private readonly authConfig: AuthConfigService,
        private readonly serverConfig: ServerConfigService,
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
                client: this.redisService.client,
                prefix: 'session:',
            }),
        });
        return middleware;
    }
}
