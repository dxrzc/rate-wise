import { EmailsQueueMock } from '@integration/mocks/queues/emails.queue.mock';
import { PaginationCacheQueueMock } from '@integration/mocks/queues/pag-cache.queue.mock';
import { testKit } from '@integration/utils/test-kit.util';
import { getQueueToken } from '@nestjs/bullmq';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test, TestingModule } from '@nestjs/testing';
import { SystemLogger } from 'src/common/logging/system.logger';
import { EMAILS_QUEUE } from 'src/emails/constants/emails.constants';
import { EmailsConsumer } from 'src/emails/consumers/emails.consumer';
import { PAGINATION_CACHE_QUEUE } from 'src/pagination/constants/pagination.constants';
import { PaginationCacheConsumer } from 'src/pagination/queues/pagination.cache.consumer';

let nestApp: NestExpressApplication;

beforeAll(async () => {
    try {
        // Disable debug logs
        jest.spyOn(SystemLogger.getInstance(), 'debug').mockImplementation();

        // Application
        const testingModule: TestingModule = await Test.createTestingModule({
            imports: [await import('src/app/app.module').then((m) => m.AppModule)],
        })
            .overrideProvider(getQueueToken(EMAILS_QUEUE))
            .useClass(EmailsQueueMock)
            .overrideProvider(EmailsConsumer)
            .useValue({}) // Consumers are created manually to prevent Worker initialization
            .overrideProvider(getQueueToken(PAGINATION_CACHE_QUEUE))
            .useClass(PaginationCacheQueueMock)
            .overrideProvider(PaginationCacheConsumer)
            .useValue({}) // Consumers are created manually to prevent Worker initialization
            .compile();

        nestApp = testingModule.createNestApplication<NestExpressApplication>();
        testKit.app = nestApp;
        nestApp.set('trust proxy', 'loopback'); // allow X-Forwarded-For from localhost
        await nestApp.init();

        // Setup EmailsQueue to directly call consumer process method
        const emailsQueueMock = testingModule.get<EmailsQueueMock>(getQueueToken(EMAILS_QUEUE));
        emailsQueueMock.createConsumer(testingModule);

        //Setup PaginationCacheQueue to directly call consumer process method
        const pagCacheQueueMock = testingModule.get<PaginationCacheQueueMock>(
            getQueueToken(PAGINATION_CACHE_QUEUE),
        );
        pagCacheQueueMock.createConsumer(testingModule);
    } catch (error) {
        console.error(error);
        if (nestApp) await nestApp.close();
        process.exit(1);
    }
});

afterAll(async () => {
    await nestApp.close();
});
