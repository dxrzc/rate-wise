import { HashingService } from 'src/common/services/hashing.service';
import { CommonModule } from 'src/common/common.module';
import { UsersModule } from 'src/users/users.module';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { Module } from '@nestjs/common';
import { HttpLoggerModule } from 'src/http-logger/http-logger.module';
import { EmailsModule } from 'src/emails/emails.module';
import { AuthNotifications } from './notifications/auth.notifications';
import { TokensModule } from 'src/tokens/tokens.module';
import { JwtPurpose } from 'src/tokens/enums/jwt-purpose.enum';
import {
    ACCOUNT_DELETION_TOKEN,
    ACCOUNT_VERIFICATION_TOKEN,
} from './constants/tokens.provider.constant';
import { AuthController } from './auth.controller';

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
        // TODO: use config service
        TokensModule.forFeatureAsync({
            provide: ACCOUNT_VERIFICATION_TOKEN,
            useFactory: () => ({
                secret: '123xdd',
                expiresIn: '10m',
                purpose: JwtPurpose.ACCOUNT_VERIFICATION,
                dataInToken: ['id'],
            }),
        }),
        TokensModule.forFeatureAsync({
            provide: ACCOUNT_DELETION_TOKEN,
            useFactory: () => ({
                secret: 'aDifferentSecret',
                expiresIn: '20m',
                purpose: JwtPurpose.ACCOUNT_DELETION,
                dataInToken: ['id'],
            }),
        }),
    ],
    controllers: [AuthController],
    providers: [AuthResolver, AuthService, HashingService, AuthNotifications],
})
export class AuthModule {}
