import { Test, TestingModule } from '@nestjs/testing';
import { JwtPurpose } from 'src/common/enum/jwt.purpose.enum';
import { REDIS_AUTH } from 'src/redis/constants/redis.constants';
import { RedisModule } from 'src/redis/redis.module';
import { RedisService } from 'src/redis/redis.service';
import { blacklistTokenKey } from 'src/tokens/functions/blacklist-token-key';
import { TokensModule } from 'src/tokens/tokens.module';
import { TokensService } from 'src/tokens/tokens.service';
import {
    InvalidDataInToken,
    InvalidToken,
    InvalidTokenPurpose,
    TokenIsBlacklisted,
} from 'src/tokens/errors/invalid-token.error';
import { createLightweightRedisContainer } from '@components/utils/create-lightweight-redis.util';

describe('Tokens Service ', () => {
    // allow any data when generating token
    let tokensService: TokensService<{ [prop: string]: any }>;
    let redisService: RedisService;
    let testingModule: TestingModule;

    beforeAll(async () => {
        testingModule = await Test.createTestingModule({
            imports: [
                RedisModule.forRootAsync({
                    useFactory: async () => ({
                        redisAuth: await createLightweightRedisContainer(),
                    }),
                }),
                TokensModule.forFeatureAsync({
                    provide: 'TEST_TOKEN_SERVICE',
                    useFactory: () => ({
                        purpose: JwtPurpose.EMAIL_CONFIRMATION,
                        expiresIn: '3m',
                        secret: '123EMAIL',
                        dataInToken: ['email'],
                    }),
                }),
            ],
        }).compile();

        redisService = testingModule.get<RedisService>(REDIS_AUTH);
        tokensService = testingModule.get('TEST_TOKEN_SERVICE');
    });

    afterAll(async () => {
        await testingModule.close();
    });

    describe('verify', () => {
        describe('Token not signed by the secret in module', () => {
            test('throw InvalidToken error', async () => {
                const badToken = tokensService['jwtService'].sign(
                    {
                        email: '',
                        purpose: JwtPurpose.EMAIL_CONFIRMATION,
                    },
                    {
                        secret: 'badSecret',
                    },
                );
                await expect(tokensService.verify(badToken)).rejects.toThrow(
                    InvalidToken,
                );
            });
        });

        describe('Invalid token purpose', () => {
            test('throw InvalidTokenPurpose error', async () => {
                const token = tokensService.generate({
                    email: '',
                    purpose: JwtPurpose.PASSWORD_RESET,
                });
                await expect(tokensService.verify(token)).rejects.toThrow(
                    InvalidTokenPurpose,
                );
            });
        });

        describe('Purpose not in token', () => {
            test('throw InvalidDataInToken error', async () => {
                const token = tokensService.generate({
                    email: '',
                    purpose: undefined,
                });
                await expect(tokensService.verify(token)).rejects.toThrow(
                    InvalidDataInToken,
                );
            });
        });

        describe('Jti not in token', () => {
            test('throw InvalidDataInToken error', async () => {
                const token = tokensService.generate({
                    email: '',
                    jti: undefined,
                });
                await expect(tokensService.verify(token)).rejects.toThrow(
                    InvalidDataInToken,
                );
            });
        });

        describe('Missing expected data in token', () => {
            test('throw InvalidDataInToken error', async () => {
                const token = tokensService.generate({
                    anotherData: 'data123',
                });
                await expect(tokensService.verify(token)).rejects.toThrow(
                    InvalidDataInToken,
                );
            });
        });

        describe('Token is blacklisted', () => {
            test('throw TokenIsBlacklisted error', async () => {
                const token = tokensService.generate({
                    email: '',
                });
                const payload = await tokensService.verify(token);
                await tokensService.blacklist(payload.jti, payload.exp);
                // verify again
                await expect(tokensService.verify(token)).rejects.toThrow(
                    TokenIsBlacklisted,
                );
            });
        });

        describe('Token is valid', () => {
            test('return payload containing jti, iat, exp, correct purpose and data in token provided', async () => {
                const email = 'test_email@gmail.com';
                const token = tokensService.generate({
                    email,
                });
                const payload = await tokensService.verify<{ email: string }>(
                    token,
                );
                expect(payload).toStrictEqual({
                    email,
                    purpose: JwtPurpose.EMAIL_CONFIRMATION,
                    jti: expect.any(String),
                    iat: expect.any(Number),
                    exp: expect.any(Number),
                });
            });
        });
    });

    describe('consume', () => {
        test('verify token and blacklist it', async () => {
            const token = tokensService.generate({
                email: '',
            });
            const payload = await tokensService.consume(token);
            const jtiInRedis = await redisService.get(
                blacklistTokenKey(payload.jti),
            );
            expect(jtiInRedis).toBe(1);
        });
    });
});
