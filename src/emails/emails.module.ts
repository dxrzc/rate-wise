import { BullModule } from '@nestjs/bullmq';
import { DynamicModule, Module } from '@nestjs/common';
import {
    FactoryConfigModule,
    FactoryConfigModuleWithExtraProvider,
} from 'src/common/types/modules/factory-config.module.type';
import { EmailsClient } from './client/emails.client';
import {
    EMAILS_QUEUE,
    EMAILS_QUEUE_OPTIONS,
    SMPT_CONNECTION_OPTIONS,
} from './constants/emails.constants';
import { EmailsConsumer } from './consumers/emails.consumer';
import { EmailsService } from './emails.service';
import { EmailsEventsListener } from './events/emails.events';
import { IEmailsQueueOptions } from './interface/emails-queue.options.interface';
import { ISmtpConnectionOptions } from './interface/smtp.connection.options.interface';

@Module({})
export class EmailsModule {
    static forRootAsync(
        options: FactoryConfigModule<ISmtpConnectionOptions>,
    ): DynamicModule {
        return {
            module: EmailsModule,
            imports: options.imports || [],
            global: true,
            providers: [
                {
                    provide: SMPT_CONNECTION_OPTIONS,
                    useFactory: options.useFactory,
                    inject: options.inject,
                },
                EmailsClient,
            ],
            exports: [EmailsClient],
        };
    }

    static forFeature(
        options: FactoryConfigModuleWithExtraProvider<IEmailsQueueOptions>,
    ): DynamicModule {
        return {
            module: EmailsModule,
            imports: [
                ...(options.imports || []),
                BullModule.registerQueueAsync({
                    name: EMAILS_QUEUE,
                }),
            ],
            providers: [
                {
                    provide: EMAILS_QUEUE_OPTIONS,
                    useFactory: options.useFactory,
                    inject: options.inject,
                },
                EmailsEventsListener,
                EmailsService,
                EmailsConsumer,
            ],
            exports: [EmailsService],
        };
    }
}
