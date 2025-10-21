import { Processor, WorkerHost } from '@nestjs/bullmq';
import { EMAILS_QUEUE } from '../constants/emails.constants';
import { EmailsClient } from '../client/emails.client';
import { IEmailInfo } from '../interface/email-info.interface';
import { Job } from 'bullmq';

@Processor(EMAILS_QUEUE, {
    concurrency: 100,
})
export class EmailsConsumer extends WorkerHost {
    constructor(private readonly client: EmailsClient) {
        super();
    }

    async process(job: Job<IEmailInfo>): Promise<void> {
        await this.client.sendMail({
            from: job.data.from,
            message: job.data.message,
            to: job.data.to,
        });
    }
}
