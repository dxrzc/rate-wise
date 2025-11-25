import { EmailsConsumer } from 'src/emails/consumers/emails.consumer';
import { IEmailInfo } from 'src/emails/interface/email-info.interface';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';
import { EmailsClient } from 'src/emails/client/emails.client';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { ClsService } from 'nestjs-cls';
import { IAls } from 'src/common/interfaces/others/async-local-storage.interface';

@Injectable()
export class EmailsQueueMock {
    public emailsConsumer!: EmailsConsumer;

    createConsumer(testingModule: TestingModule) {
        const emailsClient = testingModule.get(EmailsClient);
        const httpLogger = testingModule.get(HttpLoggerService);
        const cls = testingModule.get<ClsService<IAls>>(ClsService);
        // Consumer instance without Worker
        this.emailsConsumer = new EmailsConsumer(emailsClient, httpLogger, cls);
    }

    async add(queueName: string, data: IEmailInfo) {
        if (!this.emailsConsumer) {
            throw new Error('EmailsConsumer not set');
        }
        console.error('Email mock');
        await this.emailsConsumer.process({ data } as Job<IEmailInfo>);
    }
}
