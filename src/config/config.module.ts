import { configValidationSchema } from './schemas/config.schema';
import { ConfigModule as NestConf, ConfigService } from '@nestjs/config';
import { ServerConfigService } from './services/server.config.service';
import { SmtpConfigService } from './services/smtp.config.service';
import { AuthConfigService } from './services/auth.config.service';
import { DbConfigService } from './services/db.config.service';
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
export class ConfigModule {}
