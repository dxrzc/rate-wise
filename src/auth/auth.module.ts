import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthResolver } from './auth.resolver';
import { UsersModule } from 'src/users/users.module';
import { SessionCookiesService } from './services/session-cookies.service';

@Module({
    imports: [UsersModule],
    providers: [SessionCookiesService, AuthResolver, AuthService],
})
export class AuthModule {}
