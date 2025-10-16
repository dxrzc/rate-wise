import { Processor, WorkerHost } from '@nestjs/bullmq';
import { EMAILS_QUEUE_NAME } from './constants/emails.constants';
import { Job } from 'bullmq';

@Processor(EMAILS_QUEUE_NAME)
export class EmailsConsumer extends WorkerHost {
    // eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
    async process(job: Job, token?: string): Promise<void> {
        console.log(`Received job: ${job.name}`);
    }
}
