import { createClient } from 'redis';
import * as session from 'express-session';
import { RedisStore } from 'connect-redis';
import { Injectable } from '@nestjs/common';
import { Environment } from 'src/common/enum/environment.enum';
import { RedisConfigService } from 'src/config/services/redis-config.service';
import { ServerConfigService } from 'src/config/services/server-config.service';
import { SessionConfigService } from 'src/config/services/session-config.service';

@Injectable()
export class SessionMiddlewareFactory {
    constructor(
        private readonly redisConfig: RedisConfigService,
        private readonly sessionConfig: SessionConfigService,
        private readonly serverConfig: ServerConfigService,
    ) {}

    async create() {
        const redisClient = createClient({ url: this.redisConfig.uri });
        await redisClient.connect();
        const redisStore = new RedisStore({
            client: redisClient,
            prefix: 'myapp:',
        });

        const middleware = session({
            store: redisStore,
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
        });
        return middleware;
    }
}
