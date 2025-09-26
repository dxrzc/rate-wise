import { Repository } from 'typeorm';
import { App } from 'supertest/types';
import { INestApplication } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { UserSeedService } from 'src/seed/services/user-seed.service';
import { AuthConfigService } from 'src/config/services/auth.config.service';
import { RedisAdapter } from 'src/common/redis/redis.adapter';
import { Test } from 'supertest';

export interface ITestKit {
    app: INestApplication<App>;
    userSeed: UserSeedService;
    authConfig: AuthConfigService;
    userRepos: Repository<User>;
    sessRedisClient: RedisAdapter;
    request: Test;
}
