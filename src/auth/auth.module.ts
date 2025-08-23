import { HashingService } from 'src/common/services/hashing.service';
import { SessionService } from './services/session.service';
import { LoggingModule } from 'src/logging/logging.module';
import { UsersModule } from 'src/users/users.module';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';

@Module({
    imports: [UsersModule, CommonModule, LoggingModule],
    providers: [SessionService, AuthResolver, AuthService, HashingService],
})
export class AuthModule {}
