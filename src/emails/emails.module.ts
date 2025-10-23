import { BullModule } from '@nestjs/bullmq';
import { DynamicModule, Module } from '@nestjs/common';
import {
    FactoryConfigModule,
    FactoryConfigModuleWithExtraProvider,
} from 'src/common/types/modules/factory-config.module.type';
import { EmailsClient } from './client/emails.client';
import {
    EMAILS_FEATURE_OPTIONS,
    EMAILS_QUEUE,
    EMAILS_ROOT_OPTIONS,
} from './constants/emails.constants';
import { EmailsConsumer } from './consumers/emails.consumer';
import { EmailsService } from './emails.service';
import { IEmailsFeatureOptions } from './interface/emails.feature.options.interface';
import { HttpLoggerModule } from 'src/http-logger/http-logger.module';
import { IEmailsRootOptions } from './interface/emails.root.options.interface';

@Module({})
export class EmailsModule {
    static forRootAsync(
        options: FactoryConfigModule<IEmailsRootOptions>,
    ): DynamicModule {
        return {
            module: EmailsModule,
            imports: options.imports || [],
            global: true,
            providers: [
                {
                    provide: EMAILS_ROOT_OPTIONS,
                    useFactory: options.useFactory,
                    inject: options.inject,
                },
                EmailsClient,
            ],
            exports: [EmailsClient],
        };
    }

    static forFeature(
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
