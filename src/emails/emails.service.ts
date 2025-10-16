import { InjectQueue } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { EMAILS_QUEUE_NAME } from './constants/emails.constants';
import { Queue } from 'bullmq';

@Injectable()
export class EmailsService {
    constructor(
        @InjectQueue(EMAILS_QUEUE_NAME)
        private emailsQueue: Queue,
    ) {}

    addEmailJob() {}
}
