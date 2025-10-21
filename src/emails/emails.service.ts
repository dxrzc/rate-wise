import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { IEmailInfo } from './interface/email-info.interface';
import { IEmailsQueueOptions } from './interface/emails-queue.options.interface';
import {
    EMAILS_QUEUE,
    EMAILS_QUEUE_OPTIONS,
} from './constants/emails.constants';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class EmailsService {
    constructor(
        @InjectQueue(EMAILS_QUEUE)
        private readonly emailsQueue: Queue,
        @Inject(EMAILS_QUEUE_OPTIONS)
        private readonly queueOpts: IEmailsQueueOptions,
        private readonly cls: ClsService,
    ) {}

    async sendEmail(data: IEmailInfo) {
        // process id for logs
        Object.assign(data, { requestId: this.cls.get<string>('requestId') });
        await this.emailsQueue.add(`email`, data, {
            attempts: this.queueOpts.retryAttempts,
            removeOnComplete: true,
            removeOnFail: true,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
        });
    }
}
