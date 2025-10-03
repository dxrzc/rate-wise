import { REDIS_AUTH } from 'src/redis/constants/redis.constants';
import { RedisService } from 'src/redis/redis.service';
import { ITokensOptions } from './interfaces/tokens.options.interface';
import { isSubset } from 'src/common/functions/utils/is-subset.util';
import { JsonWebTokenError, JwtService } from '@nestjs/jwt';
import { TOKENS_OPTIONS } from './constants/tokens.constants';
import { calculateTokenTTLSeconds } from './functions/calculate-token-ttl';
import {
    InvalidDataInToken,
    InvalidToken,
    InvalidTokenPurpose,
    TokenIsBlacklisted,
} from './errors/invalid-token.error';
import { v4 as uuidv4 } from 'uuid';
import {
    Inject,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';
import { JwtPayload } from './types/jwt-payload.type';
import { blacklistTokenKey } from './functions/blacklist-token-key';

@Injectable()
export class TokensService<CustomData extends object> {
    constructor(
        @Inject(REDIS_AUTH) private readonly redisService: RedisService,
        @Inject(TOKENS_OPTIONS) private readonly tokensOpts: ITokensOptions,
        private readonly jwtService: JwtService,
    ) {
        this.tokensOpts.dataInToken.push('purpose', 'jti');
    }

    private verifyTokenOrThrow<T extends object>(token: string): JwtPayload<T> {
        try {
            return this.jwtService.verify<JwtPayload<T>>(token);
        } catch (error) {
            if (error instanceof JsonWebTokenError) {
                throw new InvalidToken(error.message);
            }
            throw new InternalServerErrorException(error);
        }
    }

    async blacklist(jti: string, expDateUnix: number): Promise<void> {
        await this.redisService.store(
            blacklistTokenKey(jti),
            '1',
            calculateTokenTTLSeconds(expDateUnix),
        );
    }

    async verify<T extends object>(token: string): Promise<JwtPayload<T>> {
        // JwtModule verification
        const payload = this.verifyTokenOrThrow<T>(token);

        // expected custom data in token (jti, purpose, tokenOpts.dataInToken)
        if (!isSubset(Object.keys(payload), this.tokensOpts.dataInToken))
            throw new InvalidDataInToken();

        // correct purpose
        if (payload.purpose !== this.tokensOpts.purpose)
            throw new InvalidTokenPurpose();

        // is not blacklisted
        if (await this.redisService.get(blacklistTokenKey(payload.jti)))
            throw new TokenIsBlacklisted();

        return payload;
    }

    async consume<T extends object>(token: string): Promise<JwtPayload<T>> {
        const payload = await this.verify<T>(token);
        await this.blacklist(payload.jti, payload.exp);
        return payload;
    }

    generate(payload: CustomData): string {
        const token = this.jwtService.sign({
            purpose: this.tokensOpts.purpose,
            jti: uuidv4(),
            ...payload,
        });
        return token;
    }
}
