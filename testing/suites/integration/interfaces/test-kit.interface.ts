import { Repository } from 'typeorm';
import { App } from 'supertest/types';
import { INestApplication } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { UserDataGenerator } from 'src/seed/generators/user-data.generator';
import { AuthConfigService } from 'src/config/services/auth.config.service';
import { Test } from 'supertest';
import { RedisClientAdapter } from 'src/common/redis/redis.client.adapter';
import { RestClient } from './rest-client.interface';
import { Cache } from '@nestjs/cache-manager';
import { AuthTokenService } from 'src/auth/types/auth-tokens-service.type';
import { Item } from 'src/items/entities/item.entity';
import { ItemDataGenerator } from 'src/seed/generators/item-data.generator';
import { ReviewDataGenerator } from 'src/seed/generators/review-data.generator';
import { Review } from 'src/reviews/entities/review.entity';
import { SeedService } from 'src/seed/seed.service';
import { Vote } from 'src/votes/entities/vote.entity';

export interface ITestKit {
    app: INestApplication<App>;
    seedService: SeedService;
    userSeed: UserDataGenerator;
    itemSeed: ItemDataGenerator;
    reviewSeed: ReviewDataGenerator;
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
