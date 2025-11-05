import { EmailsQueueMock } from '@integration/mocks/queues/emails.queue.mock';
import { testKit } from '@integration/utils/test-kit.util';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { EMAILS_QUEUE } from 'src/emails/constants/emails.constants';

let nestApp: NestExpressApplication;

beforeAll(async () => {
    try {
        // Application
        const testingModule: TestingModule = await Test.createTestingModule({
            imports: [await import('src/app/app.module').then((m) => m.AppModule)],
        })
            .overrideProvider(EMAILS_QUEUE)
            .useClass(EmailsQueueMock)
            .compile();
        nestApp = testingModule.createNestApplication<NestExpressApplication>();
        testKit.app = nestApp;
        nestApp.set('trust proxy', 'loopback'); // allow X-Forwarded-For from localhost
        await nestApp.init();
    } catch (error) {
        console.error(error);
        if (nestApp) await nestApp.close();
        process.exit(1);
    }
});

afterAll(async () => {
    await nestApp.close();
});
