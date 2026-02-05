import { InjectQueue } from '@nestjs/bullmq';
import { Inject, Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { IEmailsFeatureOptions } from './config/emails-feature.options';
import { EMAILS_FEATURE_OPTIONS, EMAILS_QUEUE } from './di/emails.providers';
import { ClsService } from 'nestjs-cls';
import { IEmailInfo } from './interface/email-info.interface';

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
