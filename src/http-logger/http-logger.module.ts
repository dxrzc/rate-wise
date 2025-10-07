import { FactoryConfigModule } from 'src/common/types/modules/factory-config.module.type';
import {
    HTTP_LOGGER_CONTEXT,
    HTTP_LOGGER_OPTIONS,
} from './constants/http-logger.options.constants';
import {
    IHttpLoggerForFeatureOptions,
    IHttpLoggerOptions,
} from './interfaces/http-logger.options.interface';
import { DynamicModule, Module } from '@nestjs/common';
import { HttpLoggerService } from './http-logger.service';

@Module({})
export class HttpLoggerModule {
    static forRootAsync(
        options: FactoryConfigModule<IHttpLoggerOptions>,
    ): DynamicModule {
        return {
            global: true,
            module: HttpLoggerModule,
            imports: [...(options.imports || [])],
            providers: [
                {
                    provide: HTTP_LOGGER_OPTIONS,
                    useFactory: options.useFactory,
                    inject: options.inject,
                },
            ],
            exports: [HTTP_LOGGER_OPTIONS],
        };
    }

    static forFeature(options: IHttpLoggerForFeatureOptions): DynamicModule {
        return {
            module: HttpLoggerModule,
            providers: [
                HttpLoggerService,
                {
                    provide: HTTP_LOGGER_CONTEXT,
                    useValue: options.context,
                },
            ],
            exports: [HttpLoggerService],
        };
    }
}
