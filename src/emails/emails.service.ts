import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Queue } from 'bullmq';
import { EMAILS_QUEUE } from './constants/emails.constants';
import { IDeduplicationConfig } from './interface/deduplication.config.interface';
import { IEmailInfo } from './interface/email-info.interface';

@Injectable()
export class EmailsService {
    constructor(
        @InjectQueue(EMAILS_QUEUE)
        private emailsQueue: Queue,
    ) {}

    async sendEmail(data: IEmailInfo, deduplication: IDeduplicationConfig) {
        // duplicated jobs added during the deduplication delay period are ignored
        await this.emailsQueue.add(`email`, data, {
            removeOnComplete: true,
            removeOnFail: true,
            deduplication,
        });
    }
}
