import { ITokensFeatureOptions } from './config/tokens-feature.options';
import { isSubset } from 'src/common/utils/is-subset.util';
import { JsonWebTokenError, JwtService } from '@nestjs/jwt';
import { TOKENS_FEATURE_OPTIONS, TOKENS_REDIS_CONNECTION } from './di/tokens.providers';
import { calculateTokenTTLSeconds } from './ttl/calculate-token-ttl';
import {
    InvalidDataInToken,
    InvalidToken,
    InvalidTokenPurpose,
    TokenIsBlacklisted,
} from './errors/invalid-token.error';
import { v4 as uuidv4 } from 'uuid';
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { JwtPayload } from './types/jwt-payload.type';
import { blacklistTokenKey } from './keys/create-blacklist-token-key';
import { RedisClientAdapter } from 'src/common/redis/redis.client.adapter';

@Injectable()
export class TokensService<CustomData extends object> {
    constructor(
        @Inject(TOKENS_REDIS_CONNECTION)
        private readonly redisClient: RedisClientAdapter,
        @Inject(TOKENS_FEATURE_OPTIONS)
        private readonly tokensOpts: ITokensFeatureOptions,
        private readonly jwtService: JwtService,
    ) {
        this.tokensOpts.dataInToken.push('purpose', 'jti');
    }

    private async verifyTokenOrThrow<T extends object>(token: string): Promise<JwtPayload<T>> {
        try {
            return await this.jwtService.verifyAsync<JwtPayload<T>>(token);
        } catch (error) {
            if (error instanceof JsonWebTokenError) {
                throw new InvalidToken(error.message);
            }
            throw new InternalServerErrorException(error);
        }
    }

    async blacklist(jti: string, expDateUnix: number): Promise<void> {
        await this.redisClient.store(
            blacklistTokenKey(jti),
            '1',
            calculateTokenTTLSeconds(expDateUnix),
        );
    }

    async verify<T extends CustomData>(token: string): Promise<JwtPayload<T>> {
        // JwtModule verification
        const payload = await this.verifyTokenOrThrow<T>(token);

        // expected custom data in token (jti, purpose, tokenOpts.dataInToken)
        if (!isSubset(Object.keys(payload), this.tokensOpts.dataInToken))
            throw new InvalidDataInToken();

        // correct purpose
        if (payload.purpose !== this.tokensOpts.purpose) throw new InvalidTokenPurpose();

        // is not blacklisted
        if (await this.redisClient.get(blacklistTokenKey(payload.jti)))
            throw new TokenIsBlacklisted();

        return payload;
    }

    async consume<T extends CustomData>(token: string): Promise<JwtPayload<T>> {
        const payload = await this.verify<T>(token);
        await this.blacklist(payload.jti, payload.exp);
        return payload;
    }

    async generate(payload: CustomData): Promise<string>;
    async generate(
        payload: CustomData,
        options: { metadata: true },
    ): Promise<{ token: string; jti: string }>;
    async generate(
        payload: CustomData,
        options?: { metadata: boolean },
    ): Promise<string | { token: string; jti: string }> {
        const jti = uuidv4();
        const token = await this.jwtService.signAsync({
            purpose: this.tokensOpts.purpose,
            jti,
            ...payload,
        });
        if (options?.metadata) {
            return { token, jti };
        }
        return token;
    }
}
