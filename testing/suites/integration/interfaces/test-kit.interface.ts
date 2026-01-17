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
import { ReviewSeedService } from 'src/seed/services/reviews-seed.service';
import { Review } from 'src/reviews/entities/review.entity';
import { SeedService } from 'src/seed/seed.service';
import { Vote } from 'src/votes/entities/vote.entity';

export interface ITestKit {
    app: INestApplication<App>;
    seedService: SeedService;
    userSeed: UserSeedService;
    itemSeed: ItemsSeedService;
    reviewSeed: ReviewSeedService;
    authConfig: AuthConfigService;
    userRepos: Repository<User>;
    itemRepos: Repository<Item>;
    reviewRepos: Repository<Review>;
    votesRepos: Repository<Vote>;
    tokensRedisClient: RedisClientAdapter;
    sessionsRedisClient: RedisClientAdapter;
    cacheManager: Cache;
    gqlClient: Test;
    restClient: RestClient;
    accDeletionToken: AuthTokenService;
    accVerifToken: AuthTokenService;
    signOutAllToken: AuthTokenService;
    endpointsREST: {
        verifyAccount: string;
        deleteAccount: string;
        signOutAll: string;
    };
}
