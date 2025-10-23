import { DynamicModule, Module } from '@nestjs/common';
import { HttpLoggerConfigService } from 'src/app/imports/http-logger/http-logger.import';
import { ClassConfigModule } from 'src/common/types/modules/class-config.module.type';
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

@Module({})
export class HttpLoggerModule {
    static forRootAsync(
        options: ClassConfigModule<IHttpLoggerRootOptions>,
    ): DynamicModule {
        return {
            global: true,
            module: HttpLoggerModule,
            imports: [...(options.imports || [])],
            providers: [
                ConsoleLoggerService,
                FileSystemLoggerService,
                RequestLoggerService,
                {
                    provide: HttpLoggerConfigService,
                    useClass: options.useClass,
                },
                {
                    provide: HTTP_LOGGER_ROOT_OPTIONS,
                    useFactory: (httpLoggerConfig: HttpLoggerConfigService) =>
                        httpLoggerConfig.create(),
                    inject: [HttpLoggerConfigService],
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
