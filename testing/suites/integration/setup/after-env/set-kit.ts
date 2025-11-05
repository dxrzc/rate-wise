import { testKit } from '@integration/utils/test-kit.util';
import { RedisClientAdapter } from 'src/common/redis/redis.client.adapter';
import { AuthConfigService } from 'src/config/services/auth.config.service';
import { UserSeedService } from 'src/seed/services/user-seed.service';
import { SESSIONS_REDIS_CONNECTION } from 'src/sessions/constants/sessions.constants';
import { TOKENS_REDIS_CONNECTION } from 'src/tokens/constants/tokens.constants';
import { User } from 'src/users/entities/user.entity';
import { DataSource } from 'typeorm';

beforeAll(() => {
    testKit.userSeed = testKit.app.get(UserSeedService);
    testKit.authConfig = testKit.app.get(AuthConfigService);
    testKit.userRepos = testKit.app.get(DataSource).getRepository(User);
    testKit.tokensRedisClient = testKit.app.get<RedisClientAdapter>(TOKENS_REDIS_CONNECTION);
    testKit.sessionsRedisClient = testKit.app.get<RedisClientAdapter>(SESSIONS_REDIS_CONNECTION);
});
