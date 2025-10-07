import { HashingService } from 'src/common/services/hashing.service';
import { CommonModule } from 'src/common/common.module';
import { UsersModule } from 'src/users/users.module';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { Module } from '@nestjs/common';
import { HttpLoggerModule } from 'src/http-logger/http-logger.module';

@Module({
    imports: [
        UsersModule,
        CommonModule,
        HttpLoggerModule.forFeature({ context: AuthService.name }),
    ],
    providers: [AuthResolver, AuthService, HashingService],
})
export class AuthModule {}
