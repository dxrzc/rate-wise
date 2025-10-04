import { FactoryConfigModule } from 'src/common/types/modules/factory-config.module.type';
import { HttpLoggerService } from './http/http-logger.service';
import { DynamicModule, Global, Module } from '@nestjs/common';
import { ILoggingOptions } from './interfaces/logging.options.interface';
import { LOGGING_OPTIONS } from './constants/logging.options.constants';

@Global()
@Module({})
export class LoggingModule {
    static forRootAsync(
        options: FactoryConfigModule<ILoggingOptions>,
    ): DynamicModule {
        return {
            module: LoggingModule,
            imports: [...(options.imports || [])],
            providers: [
                HttpLoggerService,
                {
                    provide: LOGGING_OPTIONS,
                    useFactory: options.useFactory,
                    inject: options.inject,
                },
            ],
            exports: [HttpLoggerService],
        };
    }
}
