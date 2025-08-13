import * as session from 'express-session';
import { RedisStore } from 'connect-redis';
import { Injectable } from '@nestjs/common';
import { Environment } from 'src/common/enum/environment.enum';
import { ServerConfigService } from 'src/config/services/server-config.service';
import { SessionConfigService } from 'src/config/services/session-config.service';
import { RedisService } from 'src/redis/redis.service';

@Injectable()
export class SessionMiddlewareFactory {
    constructor(
        private readonly redisService: RedisService,
        private readonly sessionConfig: SessionConfigService,
        private readonly serverConfig: ServerConfigService,
    ) {}

    create() {
        const middleware = session({
            name: this.sessionConfig.sessionCookieName,
            resave: false,
            saveUninitialized: false,
            secret: this.sessionConfig.cookieSecret,
            unset: 'destroy',
            rolling: true,
            cookie: {
                httpOnly: true,
                maxAge: this.sessionConfig.cookieMaxAge,
                secure:
                    this.serverConfig.environment === Environment.PRODUCTION,
            },
            store: new RedisStore({
                client: this.redisService.client,
                prefix: 'session:',
            }),
        });
        return middleware;
    }
}
