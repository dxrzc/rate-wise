import { EmailClient } from '@e2e/client/email.client';
import { HttpClient } from '@e2e/client/http.client';
import { e2eKit } from '@e2e/utils/e2e-kit.util';
import { ItemDataGenerator } from 'src/seed/generators/item-data.generator';
import { ReviewDataGenerator } from 'src/seed/generators/review-data.generator';
import { UserDataGenerator } from 'src/seed/generators/user-data.generator';

beforeEach(() => {
    // New instance for each test to avoid shared state (sess cookies)
    e2eKit.httpClient = new HttpClient();
});

beforeAll(() => {
    e2eKit.usersSeed = new UserDataGenerator();
    e2eKit.emailClient = new EmailClient();
    e2eKit.itemsSeed = new ItemDataGenerator();
    e2eKit.reviewSeed = new ReviewDataGenerator();
});
