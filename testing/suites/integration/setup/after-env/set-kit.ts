import {
    ACCOUNT_DELETION_TOKEN,
    ACCOUNT_VERIFICATION_TOKEN,
} from 'src/auth/constants/tokens.provider.constant';
import { testKit } from '@integration/utils/test-kit.util';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { RedisClientAdapter } from 'src/common/redis/redis.client.adapter';
import { AuthConfigService } from 'src/config/services/auth.config.service';
import { AuthTokenService } from 'src/auth/types/auth-tokens-service.type';
import { UserSeedService } from 'src/seed/services/user-seed.service';
import { SESSIONS_REDIS_CONNECTION } from 'src/sessions/constants/sessions.constants';
import { TOKENS_REDIS_CONNECTION } from 'src/tokens/constants/tokens.constants';
import { User } from 'src/users/entities/user.entity';
import { DataSource } from 'typeorm';
import { Item } from 'src/items/entities/item.entity';
import { ItemsSeedService } from 'src/seed/services/items-seed.service';
import { ReviewSeedService } from 'src/seed/services/reviews-seed.service';
import { Review } from 'src/reviews/entities/review.entity';

beforeAll(() => {
    testKit.userSeed = testKit.app.get(UserSeedService);
    testKit.itemSeed = testKit.app.get(ItemsSeedService);
    testKit.reviewSeed = testKit.app.get(ReviewSeedService);
    testKit.authConfig = testKit.app.get(AuthConfigService);
    testKit.userRepos = testKit.app.get(DataSource).getRepository(User);
    testKit.itemRepos = testKit.app.get(DataSource).getRepository(Item);
    testKit.reviewRepos = testKit.app.get(DataSource).getRepository(Review);
    testKit.tokensRedisClient = testKit.app.get<RedisClientAdapter>(TOKENS_REDIS_CONNECTION);
    testKit.sessionsRedisClient = testKit.app.get<RedisClientAdapter>(SESSIONS_REDIS_CONNECTION);
    testKit.accDeletionToken = testKit.app.get<AuthTokenService>(ACCOUNT_DELETION_TOKEN);
    testKit.accVerifToken = testKit.app.get<AuthTokenService>(ACCOUNT_VERIFICATION_TOKEN);
    testKit.cacheManager = testKit.app.get<Cache>(CACHE_MANAGER);
});
