import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { ClsService } from 'nestjs-cls';
import { IAls } from 'src/common/interfaces/others/async-local-storage.interface';
import { SystemLogger } from 'src/common/logging/system.logger';
import { HttpLoggerService } from 'src/http-logger/http-logger.service';
import { EmailsClient } from '../client/emails.client';
import { EMAILS_QUEUE } from '../constants/emails.constants';
import { IEmailInfo } from '../interface/email-info.interface';

// requestId + email info
type JobData = IAls & IEmailInfo;

@Processor(EMAILS_QUEUE, {
    concurrency: 100,
})
export class EmailsConsumer extends WorkerHost {
    constructor(
        private readonly client: EmailsClient,
        private readonly logger: HttpLoggerService,
        private readonly cls: ClsService<IAls>,
    ) {
        super();
    }

    async process(job: Job<IEmailInfo>): Promise<void> {
        const { subject, from, html, to, text } = job.data;
        await this.client.sendMail({
            subject,
            from,
            html,
            to,
            text,
        });
    }

    /**
     * Since logger already takes requestId from "cls"
     * we need to call the logging function inside a context
     * where the requestId is available.
     */
    private runInContext(requestId: string, fx: () => void) {
        this.cls.runWith({ requestId }, () => {
            fx();
        });
    }

    @OnWorkerEvent('active')
    onActive(job: Job<JobData>) {
        this.runInContext(job.data.requestId, () => {
            this.logger.debug(`Sending email to ${job.data.to}`);
        });
    }

    @OnWorkerEvent('failed')
    onFailed(job: Job<JobData>) {
        this.runInContext(job.data.requestId, () => {
            this.logger.warn(`Email service internal error`);
        });
    }

    @OnWorkerEvent('error')
    onError(error: Error) {
        SystemLogger.getInstance().error(error);
    }

    @OnWorkerEvent('completed')
    onCompleted(job: Job<JobData>) {
        this.runInContext(job.data.requestId, () => {
            this.logger.warn(`Email successfully sent to ${job.data.to}`);
        });
    }
}
