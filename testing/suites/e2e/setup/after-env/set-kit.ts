import { EmailClient } from '@e2e/client/email.client';
import { HttpClient } from '@e2e/client/http.client';
import { e2eKit } from '@e2e/utils/e2e-kit.util';
import { ItemsSeedService } from 'src/seed/services/items-seed.service';
import { ReviewSeedService } from 'src/seed/services/reviews-seed.service';
import { UserSeedService } from 'src/seed/services/user-seed.service';

beforeEach(() => {
    // New instance for each test to avoid shared state (sess cookies)
    e2eKit.httpClient = new HttpClient();
});

beforeAll(() => {
    e2eKit.usersSeed = new UserSeedService();
    e2eKit.emailClient = new EmailClient();
    e2eKit.itemsSeed = new ItemsSeedService();
    e2eKit.reviewSeed = new ReviewSeedService();
});
