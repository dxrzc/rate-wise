import { SessionMiddlewareFactory } from './middlewares/session.middleware.factory';
import { LoggingModule } from 'src/logging/logging.module';
import { SessionsService } from './sessions.service';
import { Global, Module } from '@nestjs/common';
import { SessionsEventsService } from './events/sessions.events.service';

@Global()
@Module({
    imports: [LoggingModule],
    providers: [
        SessionsService,
        SessionMiddlewareFactory,
        SessionsEventsService,
    ],
    exports: [SessionsService, SessionMiddlewareFactory],
})
export class SessionsModule {}
