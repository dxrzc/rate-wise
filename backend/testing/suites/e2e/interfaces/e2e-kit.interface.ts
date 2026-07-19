import { EmailClient } from '@e2e/client/email.client';
import { HttpClient } from '@e2e/client/http.client';
import { AppConfig } from '@e2e/config/app-config';
import { ItemDataGenerator } from 'src/seed/generators/item-data.generator';
import { ReviewDataGenerator } from 'src/seed/generators/review-data.generator';
import { UserDataGenerator } from 'src/seed/generators/user-data.generator';

export interface E2EKit {
    usersSeed: UserDataGenerator;
    itemsSeed: ItemDataGenerator;
    reviewSeed: ReviewDataGenerator;
    httpClient: HttpClient;
    emailClient: EmailClient;
    appConfig: AppConfig;
}
