import { REDIS_AUTH } from 'src/redis/constants/redis.constants';
import { RedisService } from 'src/redis/redis.service';
import { ITokensOptions } from './interfaces/tokens.options.interface';
import { isSubset } from 'src/common/functions/utils/is-subset.util';
import { JsonWebTokenError, JwtService } from '@nestjs/jwt';
import { TOKENS_OPTIONS } from './constants/tokens.constants';
import { JwtPurpose } from 'src/common/enum/jwt.purpose.enum';
import {
    InvalidDataInToken,
    InvalidToken,
    InvalidTokenPurpose,
} from './errors/invalid-token.error';
import { v4 as uuidv4 } from 'uuid';
import {
    Inject,
    Injectable,
    InternalServerErrorException,
} from '@nestjs/common';

type TokenPayload = {
    purpose: JwtPurpose;
    [prop: string]: any;
};

@Injectable()
export class TokensService {
    constructor(
        @Inject(REDIS_AUTH) private readonly redisService: RedisService,
        @Inject(TOKENS_OPTIONS) private readonly tokensOpts: ITokensOptions,
        private readonly jwtService: JwtService,
    ) {
        this.tokensOpts.dataInToken.push('purpose', 'jti');
    }

    private verifyTokenOrThrow<T extends TokenPayload>(token: string): T {
        try {
            return this.jwtService.verify<T>(token);
        } catch (error) {
            if (error instanceof JsonWebTokenError) {
                throw new InvalidToken(error.message);
            }
            throw new InternalServerErrorException(error);
        }
    }

    // eslint-disable-next-line @typescript-eslint/require-await
    async verify<T extends TokenPayload>(token: string): Promise<T> {
        // JwtModule verification
        const payload = this.verifyTokenOrThrow<T>(token);

        // expected custom data in token (jti, purpose, tokenOpts.dataInToken)
        if (!isSubset(Object.keys(payload), this.tokensOpts.dataInToken))
            throw new InvalidDataInToken();

        // correct purpose
        if (payload.purpose !== this.tokensOpts.purpose)
            throw new InvalidTokenPurpose();

        // is not blacklisted...

        return payload;
    }

    generate(payload: object): string {
        const token = this.jwtService.sign({
            purpose: this.tokensOpts.purpose,
            jti: uuidv4(),
            ...payload,
        });
        return token;
    }
}
