import { HashingService } from 'src/common/services/hashing.service';
import { LoggingModule } from 'src/logging/logging.module';
import { CommonModule } from 'src/common/common.module';
import { UsersModule } from 'src/users/users.module';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { Module } from '@nestjs/common';

@Module({
    imports: [UsersModule, CommonModule, LoggingModule],
    providers: [AuthResolver, AuthService, HashingService],
})
export class AuthModule {}
