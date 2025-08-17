import { Repository } from 'typeorm';
import { App } from 'supertest/types';
import { INestApplication } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { UserSeedService } from 'src/seed/services/user-seed.service';
import { SessionConfigService } from 'src/config/services/session-config.service';
import { RedisService } from 'src/redis/redis.service';

export interface ITestKit {
    app: INestApplication<App>;
    userSeed: UserSeedService;
    sessConfig: SessionConfigService;
    userRepos: Repository<User>;
    redisService: RedisService;
}
