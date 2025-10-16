import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { EMAILS_QUEUE_NAME } from './constants/emails.constants';
import { EmailsService } from './emails.service';
import { EmailsConsumer } from './emails.consumer';

@Module({
    imports: [BullModule.registerQueueAsync({ name: EMAILS_QUEUE_NAME })],
    providers: [EmailsService, EmailsConsumer],
})
export class EmailsModule {}
