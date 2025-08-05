import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServerConfigService } from './services/server-config.service';
import { configValidationSchema } from './schemas/config-validation.schema';
import { DatabaseConfigService } from './services/database-config.service';
import { RedisConfigService } from './services/redis-config.service';

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
    ],
    exports: [ServerConfigService, DatabaseConfigService, RedisConfigService],
})
export class AppConfigModule {}
