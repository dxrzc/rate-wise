import { testKit } from '@integration/utils/test-kit.util';
import {
    ACCOUNT_DELETION_TOKEN,
    ACCOUNT_VERIFICATION_TOKEN,
} from 'src/auth/constants/tokens.provider.constant';
import {
    IAccDeletionTokenPayload,
    IAccVerifTokenPayload,
} from 'src/auth/interfaces/tokens-payload.interface';
import { RedisClientAdapter } from 'src/common/redis/redis.client.adapter';
import { AuthConfigService } from 'src/config/services/auth.config.service';
import { UserSeedService } from 'src/seed/services/user-seed.service';
import { SESSIONS_REDIS_CONNECTION } from 'src/sessions/constants/sessions.constants';
import { TOKENS_REDIS_CONNECTION } from 'src/tokens/constants/tokens.constants';
import { TokensService } from 'src/tokens/tokens.service';
import { User } from 'src/users/entities/user.entity';
import { DataSource } from 'typeorm';

beforeAll(() => {
    testKit.userSeed = testKit.app.get(UserSeedService);
    testKit.authConfig = testKit.app.get(AuthConfigService);
    testKit.userRepos = testKit.app.get(DataSource).getRepository(User);
    testKit.tokensRedisClient = testKit.app.get<RedisClientAdapter>(TOKENS_REDIS_CONNECTION);
    testKit.sessionsRedisClient = testKit.app.get<RedisClientAdapter>(SESSIONS_REDIS_CONNECTION);
    testKit.accDeletionToken =
        testKit.app.get<TokensService<IAccDeletionTokenPayload>>(ACCOUNT_DELETION_TOKEN);
    testKit.accVerifToken = testKit.app.get<TokensService<IAccVerifTokenPayload>>(
        ACCOUNT_VERIFICATION_TOKEN,
    );
});
