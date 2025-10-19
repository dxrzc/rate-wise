import { SessionMiddlewareFactory } from './middlewares/session.middleware.factory';
import { SessionsService } from './sessions.service';
import { DynamicModule, Global, Module } from '@nestjs/common';
import { SessionsEvents } from './events/sessions.events';
import { FactoryConfigModule } from 'src/common/types/modules/factory-config.module.type';
import { ISessionsOptions } from './interfaces/sessions.options.interface';
import { SESSION_OPTIONS } from './constants/sessions.constants';
import { HttpLoggerModule } from 'src/http-logger/http-logger.module';

@Global()
@Module({})
export class SessionsModule {
    static forRootAsync(
        options: FactoryConfigModule<ISessionsOptions>,
    ): DynamicModule {
        return {
            module: SessionsModule,
            imports: [
                ...(options.imports || []),
                HttpLoggerModule.forFeature({ context: SessionsService.name }),
            ],
            providers: [
                {
                    provide: SESSION_OPTIONS,
                    useFactory: options.useFactory,
                    inject: options.inject,
                },
                SessionsService,
                SessionMiddlewareFactory,
                SessionsEvents,
            ],
            exports: [SessionsService, SessionMiddlewareFactory],
        };
    }
}
