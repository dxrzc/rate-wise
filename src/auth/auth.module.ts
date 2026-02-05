import { Module } from '@nestjs/common';
import { CommonModule } from 'src/common/common.module';
import { HashingService } from 'src/common/services/hashing.service';
import { AuthConfigService } from 'src/config/services/auth.config.service';
import { EmailsModule } from 'src/emails/emails.module';
import { HttpLoggerModule } from 'src/http-logger/http-logger.module';
import { JwtPurpose } from 'src/tokens/enums/jwt-purpose.enum';
import { TokensModule } from 'src/tokens/tokens.module';
import { UsersModule } from 'src/users/users.module';
import { AuthController } from './auth.controller';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import {
    ACCOUNT_DELETION_TOKEN,
    ACCOUNT_VERIFICATION_TOKEN,
    SIGN_OUT_ALL_TOKEN,
} from './di/auth.providers';
import { AuthNotifications } from './notifications/auth.notifications';
import { UserDeletionModule } from 'src/orchestrators/user-deletion/user-deletion.module';

@Module({
    imports: [
        UsersModule,
        UserDeletionModule,
        CommonModule,
        HttpLoggerModule.forFeature({ context: AuthService.name }),
        EmailsModule.forFeatureAsync({
            useFactory: () => ({
                queues: { retryAttempts: 3 },
            }),
        }),
        TokensModule.forFeatureAsync({
            provide: ACCOUNT_VERIFICATION_TOKEN,
            useFactory: (authConfigService: AuthConfigService) => ({
                secret: authConfigService.accountVerificationTokenSecret,
                expiresIn: authConfigService.accountVerificationTokenExp,
                purpose: JwtPurpose.ACCOUNT_VERIFICATION,
                dataInToken: ['id'],
            }),
            inject: [AuthConfigService],
        }),
        TokensModule.forFeatureAsync({
            provide: ACCOUNT_DELETION_TOKEN,
            useFactory: (authConfigService: AuthConfigService) => ({
                secret: authConfigService.accountDeletionTokenSecret,
                expiresIn: authConfigService.accountDeletionTokenExp,
                purpose: JwtPurpose.ACCOUNT_DELETION,
                dataInToken: ['id'],
            }),
            inject: [AuthConfigService],
        }),
        TokensModule.forFeatureAsync({
            provide: SIGN_OUT_ALL_TOKEN,
            useFactory: (authConfigService: AuthConfigService) => ({
                secret: authConfigService.signOutAllTokenSecret,
                expiresIn: authConfigService.signOutAllTokenExp,
                purpose: JwtPurpose.SIGN_OUT_ALL,
                dataInToken: ['id'],
            }),
            inject: [AuthConfigService],
        }),
    ],
    controllers: [AuthController],
    providers: [AuthResolver, AuthService, HashingService, AuthNotifications],
})
export class AuthModule {}
