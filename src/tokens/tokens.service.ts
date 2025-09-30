import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { REDIS_AUTH } from 'src/redis/constants/redis.constants';
import { RedisService } from 'src/redis/redis.service';
import { ITokensOptions } from './interfaces/tokens.options.interface';
import { TOKENS_OPTIONS } from './constants/tokens.constants';

@Injectable()
export class TokensService {
    constructor(
        @Inject(REDIS_AUTH) private readonly redisService: RedisService,
        @Inject(TOKENS_OPTIONS) private readonly tokensOpts: ITokensOptions,
        private readonly jwtService: JwtService,
    ) {}

    generate(payload: object): string {
        const token = this.jwtService.sign({
            purpose: this.tokensOpts.type,
            ...payload,
        });
        return token;
    }
}
