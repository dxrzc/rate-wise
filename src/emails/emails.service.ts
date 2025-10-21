import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { IDeduplicationConfig } from './interface/deduplication.config.interface';
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

    // duplicated jobs added during the deduplication delay period are ignored
    async sendEmail(data: IEmailInfo, deduplication: IDeduplicationConfig) {
        Object.assign(data, { requestId: this.cls.get<string>('requestId') }); // process id for logs
        await this.emailsQueue.add(`email`, data, {
            attempts: this.queueOpts.retryAttempts,
            removeOnComplete: true,
            removeOnFail: true,
            deduplication,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
        });
    }
}
