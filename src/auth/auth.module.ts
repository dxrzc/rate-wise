import { HashingService } from 'src/common/services/hashing.service';
import { CommonModule } from 'src/common/common.module';
import { UsersModule } from 'src/users/users.module';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { Module } from '@nestjs/common';
import { HttpLoggerModule } from 'src/http-logger/http-logger.module';
import { EmailsModule } from 'src/emails/emails.module';
import { AuthNotifications } from './notifications/auth.notifications';

@Module({
    imports: [
        UsersModule,
        CommonModule,
        HttpLoggerModule.forFeature({ context: AuthService.name }),
        EmailsModule.forFeatureAsync({
            useFactory: () => ({
                queues: {
                    retryAttempts: 3,
                },
            }),
        }),
    ],
    providers: [AuthResolver, AuthService, HashingService, AuthNotifications],
})
export class AuthModule {}
