import { FactoryConfigModule } from 'src/common/types/modules/factory-config.module.type';
import { HTTP_LOGGER_OPTIONS } from './constants/http-logger.options.constants';
import { IHttpLoggerOptions } from './interfaces/http-logger.options.interface';
import { DynamicModule, Global, Module } from '@nestjs/common';
import { HttpLoggerService } from './http-logger.service';

@Global()
@Module({})
export class HttpLoggerModule {
    static forRootAsync(
        options: FactoryConfigModule<IHttpLoggerOptions>,
    ): DynamicModule {
        return {
            module: HttpLoggerModule,
            imports: [...(options.imports || [])],
            providers: [
                HttpLoggerService,
                {
                    provide: HTTP_LOGGER_OPTIONS,
                    useFactory: options.useFactory,
                    inject: options.inject,
                },
            ],
            exports: [HttpLoggerService],
        };
    }
}
