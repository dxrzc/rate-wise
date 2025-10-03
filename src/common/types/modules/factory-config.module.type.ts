import { ConfigurableModuleAsyncOptions, Provider } from '@nestjs/common';

/**
 * Forces "useFactory" and optionally, "imports" and "inject"
 */
export type FactoryConfigModule<T> = Required<
    Pick<ConfigurableModuleAsyncOptions<T>, 'useFactory'>
> &
    Pick<ConfigurableModuleAsyncOptions<T>, 'imports' | 'inject'>;

/**
 * Forces "useFactory" and optionally, "imports", "inject" and "extraProviders"
 */
export type FactoryConfigModuleWithExtraProvider<T> =
    ConfigurableModuleAsyncOptions<T> & {
        extraProviders?: Provider[];
    };

/**
 * Forces "useFactory" and a custom exported token in "provide".
 * Optionally: "imports", "inject"
 */
export type FactoryConfigModuleWithCustomToken<T> = FactoryConfigModule<T> & {
    provide: string;
};
