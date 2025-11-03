import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { IEmailInfo } from './interface/email-info.interface';
import { IEmailsFeatureOptions } from './interface/emails.feature.options.interface';
import { EMAILS_FEATURE_OPTIONS, EMAILS_QUEUE } from './constants/emails.constants';
import { ClsService } from 'nestjs-cls';

@Injectable()
export class EmailsService {
    constructor(
        @InjectQueue(EMAILS_QUEUE)
        private readonly emailsQueue: Queue,
        @Inject(EMAILS_FEATURE_OPTIONS)
        private readonly options: IEmailsFeatureOptions,
        private readonly cls: ClsService,
    ) {}

    async sendEmail(data: IEmailInfo) {
        // process id for logs
        Object.assign(data, { requestId: this.cls.get<string>('requestId') });
        await this.emailsQueue.add(`email`, data, {
            attempts: this.options.queues.retryAttempts,
            removeOnComplete: true,
            removeOnFail: true,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
        });
    }
}
