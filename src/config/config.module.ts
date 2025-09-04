import { envSchema, integrationEnvSchema } from './schemas/config.schema';
import { ConfigModule as NestConf, ConfigService } from '@nestjs/config';
import { ServerConfigService } from './services/server.config.service';
import { SmtpConfigService } from './services/smtp.config.service';
import { AuthConfigService } from './services/auth.config.service';
import { DbConfigService } from './services/db.config.service';
import { Environment } from 'src/common/enum/environment.enum';
import { Global, Module } from '@nestjs/common';

const services = [
    AuthConfigService,
    DbConfigService,
    ServerConfigService,
    SmtpConfigService,
];

@Global()
@Module({
    imports: [
        NestConf.forRoot({
            validationSchema:
                process.env.NODE_ENV === Environment.INTEGRATION
                    ? integrationEnvSchema
                    : envSchema,
            expandVariables: true,
            validatePredefined: true,
            validationOptions: {
                allowUnknown: true,
                abortEarly: true,
            },
        }),
    ],
    providers: [ConfigService, ...services],
    exports: services,
})
export class ConfigModule {}
