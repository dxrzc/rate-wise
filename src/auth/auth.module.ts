import { SessionService } from './services/session.service';
import { UsersModule } from 'src/users/users.module';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { Module } from '@nestjs/common';

@Module({
    imports: [UsersModule],
    providers: [SessionService, AuthResolver, AuthService],
})
export class AuthModule {}
