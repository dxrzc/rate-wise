import { AsyncConfigModuleWithCustomProvider } from 'src/common/types/modules/async-config.module.type';
import { ITokensOptions } from './interfaces/tokens.options.interface';
import { TOKENS_OPTIONS } from './constants/tokens.constants';
import { DynamicModule, Module } from '@nestjs/common';
import { TokensService } from './tokens.service';
import { JwtModule } from '@nestjs/jwt';

@Module({})
export class TokensModule {
    static forFeatureAsync(
        options: AsyncConfigModuleWithCustomProvider<ITokensOptions>,
    ): DynamicModule {
        if (!options.useFactory)
            throw new Error('TokensModule requires useFactory option');

        const moduleOptionsProvider = {
            provide: TOKENS_OPTIONS,
            useFactory: options.useFactory,
            inject: options.inject,
        };

        return {
            module: TokensModule,
            imports: [
                JwtModule.registerAsync({
                    extraProviders: [moduleOptionsProvider],
                    inject: [TOKENS_OPTIONS],
                    useFactory: (tokenOpts: ITokensOptions) => ({
                        secret: tokenOpts.secret,
                        signOptions: { expiresIn: tokenOpts.expiresIn },
                    }),
                }),
            ],
            providers: [
                TokensService,
                moduleOptionsProvider,
                {
                    provide: options.provide,
                    useExisting: TokensService,
                },
            ],
            exports: [TokensService, options.provide],
        };
    }
}
