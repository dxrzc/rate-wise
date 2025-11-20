import { Repository } from 'typeorm';
import { App } from 'supertest/types';
import { INestApplication } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { UserSeedService } from 'src/seed/services/user-seed.service';
import { AuthConfigService } from 'src/config/services/auth.config.service';
import { Test } from 'supertest';
import { RedisClientAdapter } from 'src/common/redis/redis.client.adapter';
import { RestClient } from './rest-client.interface';
import { Cache } from '@nestjs/cache-manager';
import { AuthTokenService } from 'src/auth/types/auth-tokens-service.type';
import { Item } from 'src/items/entities/item.entity';
import { ItemsSeedService } from 'src/seed/services/items-seed.service';

export interface ITestKit {
    app: INestApplication<App>;
    userSeed: UserSeedService;
    itemSeed: ItemsSeedService;
    authConfig: AuthConfigService;
    userRepos: Repository<User>;
    itemRepos: Repository<Item>;
    tokensRedisClient: RedisClientAdapter;
    sessionsRedisClient: RedisClientAdapter;
    cacheManager: Cache;
    gqlClient: Test;
    restClient: RestClient;
    accDeletionToken: AuthTokenService;
    accVerifToken: AuthTokenService;
    endpointsREST: {
        verifyAccount: string;
        deleteAccount: string;
    };
}
