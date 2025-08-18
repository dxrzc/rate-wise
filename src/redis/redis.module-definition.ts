import { ConfigurableModuleBuilder } from '@nestjs/common';
import { IRedisModuleOptions } from './interfaces/redis-module-options.interface';

export const { ConfigurableModuleClass, MODULE_OPTIONS_TOKEN } =
    new ConfigurableModuleBuilder<IRedisModuleOptions>()
        .setExtras(
            {
                isGlobal: true,
            },
            (definition, extras) => ({
                ...definition,
                global: extras.isGlobal,
            }),
        )
        .setClassMethodName('forRoot')
        .build();
