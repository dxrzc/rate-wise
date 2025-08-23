import { SessionService } from './services/session.service';
import { LoggingModule } from 'src/logging/logging.module';
import { UsersModule } from 'src/users/users.module';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { Module } from '@nestjs/common';

@Module({
    imports: [UsersModule, LoggingModule],
    providers: [SessionService, AuthResolver, AuthService],
})
export class AuthModule {}
