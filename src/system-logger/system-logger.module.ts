import { DynamicModule, Global, Module } from '@nestjs/common';
import { FactoryConfigModule } from 'src/common/types/modules/factory-config.module.type';
import { ISystemLoggerOptions } from './interfaces/system-logger.options.interface';
import { SYSTEM_LOGGER_OPTIONS } from './constants/system-logger.constants';
import { SystemLoggerService } from './system-logger.service';

@Global()
@Module({})
export class SystemLoggerModule {
    static forRootAsync(
        options: FactoryConfigModule<ISystemLoggerOptions>,
    ): DynamicModule {
        return {
            imports: options.imports,
            module: SystemLoggerModule,
            providers: [
                {
                    provide: SYSTEM_LOGGER_OPTIONS,
                    useFactory: options.useFactory,
                    inject: options.inject || [],
                },
                SystemLoggerService,
            ],
            exports: [SystemLoggerService],
        };
    }
}
