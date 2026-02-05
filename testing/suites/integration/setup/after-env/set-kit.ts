import { testKit } from '@integration/utils/test-kit.util';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import {
    ACCOUNT_DELETION_TOKEN,
    ACCOUNT_VERIFICATION_TOKEN,
    SIGN_OUT_ALL_TOKEN,
} from 'src/auth/constants/auth.providers';
import { AuthTokenService } from 'src/auth/types/auth-tokens-service.type';
import { RedisClientAdapter } from 'src/common/redis/redis.client.adapter';
import { AuthConfigService } from 'src/config/services/auth.config.service';
import { Item } from 'src/items/entities/item.entity';
import { Review } from 'src/reviews/entities/review.entity';
import { SeedService } from 'src/seed/seed.service';
import { ItemsSeedService } from 'src/seed/services/items-seed.service';
import { ReviewSeedService } from 'src/seed/services/reviews-seed.service';
import { UserSeedService } from 'src/seed/services/user-seed.service';
import { SESSIONS_REDIS_CONNECTION } from 'src/sessions/constants/sessions.constants';
import { TOKENS_REDIS_CONNECTION } from 'src/tokens/constants/tokens.constants';
import { User } from 'src/users/entities/user.entity';
import { Vote } from 'src/votes/entities/vote.entity';
import { DataSource } from 'typeorm';

beforeAll(() => {
    testKit.userSeed = testKit.app.get(UserSeedService);
    testKit.itemSeed = testKit.app.get(ItemsSeedService);
    testKit.reviewSeed = testKit.app.get(ReviewSeedService);
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
