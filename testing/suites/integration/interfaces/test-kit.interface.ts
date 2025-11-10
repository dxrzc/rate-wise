import { Repository } from 'typeorm';
import { App } from 'supertest/types';
import { INestApplication } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { UserSeedService } from 'src/seed/services/user-seed.service';
import { AuthConfigService } from 'src/config/services/auth.config.service';
import { Test } from 'supertest';
import { RedisClientAdapter } from 'src/common/redis/redis.client.adapter';
import { RestClient } from './rest-client.interface';
import { TokensService } from 'src/tokens/tokens.service';
import {
    IAccDeletionTokenPayload,
    IAccVerifTokenPayload,
} from 'src/auth/interfaces/tokens-payload.interface';
import { Cache } from '@nestjs/cache-manager';

export interface ITestKit {
    app: INestApplication<App>;
    userSeed: UserSeedService;
    authConfig: AuthConfigService;
    userRepos: Repository<User>;
    tokensRedisClient: RedisClientAdapter;
    sessionsRedisClient: RedisClientAdapter;
    cacheManager: Cache;
    gqlClient: Test;
    restClient: RestClient;
    accDeletionToken: TokensService<IAccDeletionTokenPayload>;
    accVerifToken: TokensService<IAccVerifTokenPayload>;
    endpointsREST: {
        verifyAccount: string;
        deleteAccount: string;
    };
}
