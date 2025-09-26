import { Inject, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { RedisAdapter } from 'src/common/redis/redis.adapter';
import { REDIS_TOKENS_CLIENT } from './constants/redis-tokens-client.token.constant';

@Injectable()
export class TokensService {
    constructor(
        @Inject(REDIS_TOKENS_CLIENT)
        private readonly redisAdapter: RedisAdapter,
        private readonly jwtService: JwtService,
    ) {}

    generate(payload: string): string {
        const token = this.jwtService.sign(payload);
        return token;
    }
}
