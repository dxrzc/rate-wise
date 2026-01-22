import { EmailClient } from '@e2e/client/email.client';
import { HttpClient } from '@e2e/client/http.client';
import { AppConfig } from '@e2e/config/app-config';
import { ItemsSeedService } from 'src/seed/services/items-seed.service';
import { ReviewSeedService } from 'src/seed/services/reviews-seed.service';
import { UserSeedService } from 'src/seed/services/user-seed.service';

export interface E2EKit {
    usersSeed: UserSeedService;
    itemsSeed: ItemsSeedService;
    reviewSeed: ReviewSeedService;
    httpClient: HttpClient;
    emailClient: EmailClient;
    appConfig: AppConfig;
}
