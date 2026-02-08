import { testKit } from '@integration/utils/test-kit.util';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import {
    ACCOUNT_DELETION_TOKEN,
    ACCOUNT_VERIFICATION_TOKEN,
    SIGN_OUT_ALL_TOKEN,
} from 'src/auth/di/auth.providers';
import { AuthTokenService } from 'src/auth/types/auth-tokens-service.type';
import { RedisClientAdapter } from 'src/common/redis/redis.client.adapter';
import { AuthConfigService } from 'src/config/services/auth.config.service';
import { Item } from 'src/items/entities/item.entity';
import { Review } from 'src/reviews/entities/review.entity';
import { ItemDataGenerator } from 'src/seed/generators/item-data.generator';
import { ReviewDataGenerator } from 'src/seed/generators/review-data.generator';
import { UserDataGenerator } from 'src/seed/generators/user-data.generator';
import { SeedService } from 'src/seed/seed.service';
import { SESSIONS_REDIS_CONNECTION } from 'src/sessions/di/sessions.providers';
import { TOKENS_REDIS_CONNECTION } from 'src/tokens/di/tokens.providers';
import { User } from 'src/users/entities/user.entity';
import { Vote } from 'src/votes/entities/vote.entity';
import { DataSource } from 'typeorm';

beforeAll(() => {
    testKit.userSeed = testKit.app.get(UserDataGenerator);
    testKit.itemSeed = testKit.app.get(ItemDataGenerator);
    testKit.reviewSeed = testKit.app.get(ReviewDataGenerator);
    testKit.seedService = testKit.app.get(SeedService);
    testKit.authConfig = testKit.app.get(AuthConfigService);
    testKit.userRepos = testKit.app.get(DataSource).getRepository(User);
    testKit.itemRepos = testKit.app.get(DataSource).getRepository(Item);
    testKit.votesRepos = testKit.app.get(DataSource).getRepository(Vote);
    testKit.reviewRepos = testKit.app.get(DataSource).getRepository(Review);
    testKit.tokensRedisClient = testKit.app.get<RedisClientAdapter>(TOKENS_REDIS_CONNECTION);
    testKit.sessionsRedisClient = testKit.app.get<RedisClientAdapter>(SESSIONS_REDIS_CONNECTION);
    testKit.accDeletionToken = testKit.app.get<AuthTokenService>(ACCOUNT_DELETION_TOKEN);
    testKit.accVerifToken = testKit.app.get<AuthTokenService>(ACCOUNT_VERIFICATION_TOKEN);
    testKit.signOutAllToken = testKit.app.get<AuthTokenService>(SIGN_OUT_ALL_TOKEN);
    testKit.cacheManager = testKit.app.get<Cache>(CACHE_MANAGER);
});
