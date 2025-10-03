import { Test, TestingModule } from '@nestjs/testing';
import { RedisContainer } from '@testcontainers/redis';
import { JwtPurpose } from 'src/common/enum/jwt.purpose.enum';
import { RedisModule } from 'src/redis/redis.module';
import {
    InvalidDataInToken,
    InvalidToken,
    InvalidTokenPurpose,
} from 'src/tokens/errors/invalid-token.error';
import { TokensModule } from 'src/tokens/tokens.module';
import { TokensService } from 'src/tokens/tokens.service';

describe('Tokens Service ', () => {
    let tokensService: TokensService;
    let testingModule: TestingModule;

    beforeAll(async () => {
        const redisContainer = await new RedisContainer('redis:8.0-alpine')
            .withCommand([
                'redis-server',
                '--appendonly',
                'no', // AOF persistence
                '--save',
                '""', // disables snapshots
            ])
            .withTmpFs({ '/data': 'rw' })
            .start();

        testingModule = await Test.createTestingModule({
            imports: [
                RedisModule.forRootAsync({
                    useFactory: () => ({
                        redisAuth: redisContainer.getConnectionUrl(),
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
    });
});
