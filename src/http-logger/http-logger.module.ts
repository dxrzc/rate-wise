import { DynamicModule, Module } from '@nestjs/common';
import { ClassConfigModule } from 'src/common/types/class-config.module.type';
import {
    HTTP_LOGGER_FEATURE_OPTIONS,
    HTTP_LOGGER_ROOT_OPTIONS,
} from './constants/http-logger.options.constants';
import { HttpLoggerService } from './http-logger.service';
import { ConsoleLoggerService } from './services/console.logger.service';
import { FileSystemLoggerService } from './services/file-system.logger.service';
import { RequestLoggerService } from './services/request.logger.service';
import { IHttpLoggerRootOptions } from './interfaces/http-logger.root.options.interface';
import { IHttpLoggerFeatureOptions } from './interfaces/http-logger.feature.options.interface';
import { IHttpLoggerOptionsFactory } from './interfaces/http-logger.options.factory.interface';

@Module({})
export class HttpLoggerModule {
    static forRootAsync(options: ClassConfigModule<IHttpLoggerRootOptions>): DynamicModule {
        return {
            global: true,
            module: HttpLoggerModule,
            imports: [...(options.imports || [])],
            providers: [
                ConsoleLoggerService,
                FileSystemLoggerService,
                RequestLoggerService,
                {
                    provide: 'HTTP_LOGGER_CONFIG_SERVICE',
                    useClass: options.useClass,
                },
                {
                    provide: HTTP_LOGGER_ROOT_OPTIONS,
                    useFactory: (httpLoggerConfig: IHttpLoggerOptionsFactory) =>
                        httpLoggerConfig.create(),
                    inject: ['HTTP_LOGGER_CONFIG_SERVICE'],
                },
            ],
            exports: [
                HTTP_LOGGER_ROOT_OPTIONS,
                ConsoleLoggerService,
                FileSystemLoggerService,
                RequestLoggerService,
            ],
        };
    }

    static forFeature(options: IHttpLoggerFeatureOptions): DynamicModule {
        return {
            module: HttpLoggerModule,
            providers: [
                HttpLoggerService,
                {
                    provide: HTTP_LOGGER_FEATURE_OPTIONS,
                    useValue: options,
                },
            ],
            exports: [HttpLoggerService],
        };
    }
}
