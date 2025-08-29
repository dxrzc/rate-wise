import { configValidationSchema } from './schemas/config.schema';
import { ConfigModule as NestConf, ConfigService } from '@nestjs/config';
import { Global, Module } from '@nestjs/common';

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
    providers: [ConfigService],
})
export class ConfigModule {}
