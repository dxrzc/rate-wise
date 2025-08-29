import { configValidationSchema } from './schemas/config-validation.schema';
import { DatabaseConfigService } from './services/database-config.service';
import { SessionConfigService } from './services/session-config.service';
import { ServerConfigService } from './services/server-config.service';
import { RedisConfigService } from './services/redis-config.service';
import { SMTPConfigService } from './services/smtp-config.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Global, Module } from '@nestjs/common';

const services = [
    ServerConfigService,
    DatabaseConfigService,
    RedisConfigService,
    SessionConfigService,
    SMTPConfigService,
];

@Global()
@Module({
    imports: [
        ConfigModule.forRoot({
            validationSchema: configValidationSchema,
            expandVariables: true,
            validatePredefined: true,
            envFilePath: `.env.${process.env.NODE_ENV?.slice(0, 3)}`, // dev, int, e2e
            validationOptions: {
                allowUnknown: true,
                abortEarly: true,
            },
        }),
    ],
    providers: [ConfigService, ...services],
    exports: services,
})
export class AppConfigModule {}
