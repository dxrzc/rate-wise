import { ConfigurableModuleAsyncOptions } from '@nestjs/common';

export type FactoryConfigModule<T> = Required<
    Pick<ConfigurableModuleAsyncOptions<T>, 'useFactory'>
> &
    Pick<ConfigurableModuleAsyncOptions<T>, 'imports' | 'inject'>;
