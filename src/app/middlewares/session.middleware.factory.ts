import * as session from 'express-session';
import { createClient } from 'redis';
import { RedisStore } from 'connect-redis';
import { Injectable } from '@nestjs/common';
import { Environment } from 'src/common/enum/environment.enum';
import { RedisConfigService } from 'src/config/services/redis-config.service';
import { SessionConfigService } from 'src/config/services/session-config.service';
import { ServerConfigService } from 'src/config/services/server-config.service';

@Injectable()
export class SessionMiddlewareFactory {
    constructor(
        private readonly redisConfig: RedisConfigService,
        private readonly sessionConfig: SessionConfigService,
        private readonly serverConfig: ServerConfigService,
    ) {}

    async create() {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
        const redisClient = createClient({ url: this.redisConfig.uri });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        await redisClient.connect();

        // Initialize store.
        const redisStore = new RedisStore({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            client: redisClient,
            prefix: 'myapp:',
        });

        const middleware = session({
            store: redisStore,
            resave: false,
            saveUninitialized: false,
            secret: this.sessionConfig.cookieSecret,
            unset: 'destroy',
            cookie: {
                httpOnly: true,
                secure:
                    this.serverConfig.environment === Environment.PRODUCTION,
                maxAge: this.sessionConfig.cookieMaxAge,
            },
            rolling: true,
        });

        return middleware;
    }
}
