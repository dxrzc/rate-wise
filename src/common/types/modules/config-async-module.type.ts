import { ConfigurableModuleAsyncOptions, Provider } from '@nestjs/common';

export type AsyncConfigModule<T> = ConfigurableModuleAsyncOptions<T> & {
    extraProviders?: Provider[];
};
