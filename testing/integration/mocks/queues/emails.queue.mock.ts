import { EmailsConsumer } from 'src/emails/consumers/emails.consumer';
import { IEmailInfo } from 'src/emails/interface/email-info.interface';
import { Job } from 'bullmq';

export class EmailsQueueMock {
    constructor(private readonly emailsConsumer: EmailsConsumer) {}

    async add(queueName: string, data: IEmailInfo) {
        await this.emailsConsumer.process({ data } as Job<IEmailInfo>);
    }
}
