import { AppConfig } from '@e2e/config/app-config';
import { e2eKit } from '@e2e/utils/e2e-kit.util';
import { config } from 'dotenv';

config({ path: `${process.cwd()}/.env.defaults` });
config({ path: `${process.cwd()}/.env.e2e`, override: true });

beforeAll(() => {
    e2eKit.appConfig = new AppConfig();
});
