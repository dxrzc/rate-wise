import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServerConfigService } from './services/server.config.service';
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
    providers: [ServerConfigService, ConfigService],
    exports: [ServerConfigService],
})
export class AppConfigModule {}
