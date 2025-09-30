import { SessionMiddlewareFactory } from './middlewares/session.middleware.factory';
import { LoggingModule } from 'src/logging/logging.module';
import { SessionsService } from './sessions.service';
import { Global, Module } from '@nestjs/common';

@Global()
@Module({
    imports: [LoggingModule],
    providers: [SessionsService, SessionMiddlewareFactory],
    exports: [SessionsService, SessionMiddlewareFactory],
})
export class SessionsModule {}
