import { BullModule } from '@nestjs/bullmq';
import { DynamicModule, Module } from '@nestjs/common';
import {
    FactoryConfigModule,
    FactoryConfigModuleWithExtraProvider,
} from 'src/common/types/factory-config.module.type';
import { EmailClient } from './client/email.client';
import { EMAILS_FEATURE_OPTIONS, EMAILS_QUEUE, EMAILS_ROOT_OPTIONS } from './di/emails.providers';
import { EmailsConsumer } from './consumers/emails.consumer';
import { EmailsService } from './emails.service';
import { IEmailsFeatureOptions } from './config/emails-feature.options';
import { HttpLoggerModule } from 'src/http-logger/http-logger.module';
import { IEmailsRootOptions } from './config/emails.root.options';
import { EmailHealthIndicator } from './health/email.health';
import { TerminusModule } from '@nestjs/terminus';

@Module({})
export class EmailsModule {
    static forRootAsync(options: FactoryConfigModule<IEmailsRootOptions>): DynamicModule {
        return {
            module: EmailsModule,
            imports: [...(options.imports || []), TerminusModule],
            global: true,
            providers: [
                {
                    provide: EMAILS_ROOT_OPTIONS,
                    useFactory: options.useFactory,
                    inject: options.inject,
                },
                EmailClient,
                EmailHealthIndicator,
            ],
            exports: [EmailClient, EmailHealthIndicator],
        };
    }

    static forFeatureAsync(
        options: FactoryConfigModuleWithExtraProvider<IEmailsFeatureOptions>,
    ): DynamicModule {
        return {
            module: EmailsModule,
            imports: [
                ...(options.imports || []),
                BullModule.registerQueueAsync({
                    name: EMAILS_QUEUE,
                }),
                HttpLoggerModule.forFeature({ context: EmailsService.name }),
            ],
            providers: [
                {
                    provide: EMAILS_FEATURE_OPTIONS,
                    useFactory: options.useFactory,
                    inject: options.inject,
                },
                EmailsService,
                EmailsConsumer,
            ],
            exports: [EmailsService],
        };
    }
}
