import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { UsersModule } from 'src/users/users.module';
import { SessionsService } from './services/session-cookies.service';

@Module({
    imports: [UsersModule],
    providers: [SessionsService, AuthResolver, AuthService],
})
export class AuthModule {}
