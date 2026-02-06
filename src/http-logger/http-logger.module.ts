import { DynamicModule, Module } from '@nestjs/common';
import { ClassConfigModule } from 'src/common/types/class-config.module.type';
import { HTTP_LOGGER_FEATURE_OPTIONS, HTTP_LOGGER_ROOT_OPTIONS } from './di/http-logger.providers';
import { HttpLoggerService } from './http-logger.service';
import { ConsoleLoggerService } from './services/console.logger.service';
import { FileSystemLoggerService } from './services/file-system.logger.service';
import { RequestLoggerService } from './services/request.logger.service';
import { IHttpLoggerRootOptions } from './config/http-logger-root.options';
import { IHttpLoggerFeatureOptions } from './config/http-logger-feature.options';
import { IHttpLoggerOptionsFactory } from './config/http-logger-factory.options';

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
