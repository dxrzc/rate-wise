import { Repository } from 'typeorm';
import { App } from 'supertest/types';
import { INestApplication } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { UserSeedService } from 'src/seed/services/user-seed.service';
import { AuthConfigService } from 'src/config/services/auth.config.service';
import { Test } from 'supertest';
import { RedisClientAdapter } from 'src/common/redis/redis.client.adapter';
import { RestClient } from './rest-client.interface';

export interface ITestKit {
    app: INestApplication<App>;
    userSeed: UserSeedService;
    authConfig: AuthConfigService;
    userRepos: Repository<User>;
    tokensRedisClient: RedisClientAdapter;
    sessionsRedisClient: RedisClientAdapter;
    gqlClient: Test;
    restClient: RestClient;
    endpointsREST: {
        verifyAccount: string;
    };
}
