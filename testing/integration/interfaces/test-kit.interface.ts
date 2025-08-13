import { Repository } from 'typeorm';
import { App } from 'supertest/types';
import { INestApplication } from '@nestjs/common';
import { User } from 'src/users/entities/user.entity';
import { UserSeedService } from 'src/seed/services/user-seed.service';
import { SessionConfigService } from 'src/config/services/session-config.service';

export interface ITestKit {
    app: INestApplication<App>;
    userSeed: UserSeedService;
    sessionConfig: SessionConfigService;
    userRepos: Repository<User>;
}
