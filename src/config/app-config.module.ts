import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisConfigService } from './services/redis-config.service';
import { ServerConfigService } from './services/server-config.service';
import { SessionConfigService } from './services/session-config.service';
import { DatabaseConfigService } from './services/database-config.service';
import { configValidationSchema } from './schemas/config-validation.schema';

@Global()
@Module({
    imports: [
        ConfigModule.forRoot({
            expandVariables: true,
            validationSchema: configValidationSchema,
            validatePredefined: true,
            validationOptions: {
                allowUnknown: true,
                abortEarly: true,
            },
        }),
    ],
    providers: [
        ConfigService,
        ServerConfigService,
        DatabaseConfigService,
        RedisConfigService,
        SessionConfigService,
    ],
    exports: [
        ServerConfigService,
        DatabaseConfigService,
        RedisConfigService,
        SessionConfigService,
    ],
})
export class AppConfigModule {}
