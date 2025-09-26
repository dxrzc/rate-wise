import { AuthConfigService } from 'src/config/services/auth.config.service';
import { DbConfigService } from 'src/config/services/db.config.service';
import { HashingService } from 'src/common/services/hashing.service';
import { LoggingModule } from 'src/logging/logging.module';
import { CommonModule } from 'src/common/common.module';
import { TokensModule } from 'src/tokens/tokens.module';
import { UsersModule } from 'src/users/users.module';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { Module } from '@nestjs/common';

@Module({
    imports: [
        UsersModule,
        CommonModule,
        LoggingModule,
        TokensModule.forFeature({
            inject: [DbConfigService, AuthConfigService],
            useFactory: (
                dbConfig: DbConfigService,
                authConfig: AuthConfigService,
            ) => ({
                tokenSecret: authConfig.emailTokenSecret,
                expiresIn: authConfig.emailTokenExpTime,
                redisUri: dbConfig.redisAuthUri,
            }),
        }),
    ],
    providers: [AuthResolver, AuthService, HashingService],
})
export class AuthModule {}
