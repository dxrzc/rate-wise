import { INestApplication } from '@nestjs/common';
import { UserSeedService } from 'src/seed/services/user-seed.service';
import { App } from 'supertest/types';

export interface ITestKit {
    app: INestApplication<App>;
    userSeed: UserSeedService;
}
