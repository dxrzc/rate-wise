import { ConfigurableModuleAsyncOptions } from '@nestjs/common';

export type ClassConfigModule<T> = Required<Pick<ConfigurableModuleAsyncOptions<T>, 'useClass'>> &
    Pick<ConfigurableModuleAsyncOptions<T>, 'imports' | 'inject'>;
