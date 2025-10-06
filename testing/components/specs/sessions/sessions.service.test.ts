import { Test, TestingModule } from '@nestjs/testing';
import { RedisContainer } from '@testcontainers/redis';
import { HttpLoggerModule } from 'src/http-logger/http-logger.module';
import { RedisModule } from 'src/redis/redis.module';
import { SessionsModule } from 'src/sessions/sessions.module';
import { SessionsService } from 'src/sessions/sessions.service';

type MockRequestType = {
    sessionID: string;
    session: {
        userId: string;
        regenerate: jest.MockedFunction<any>;
        destroy: jest.MockedFunction<any>;
    };
};

describe('Sessions Service ', () => {
    let testingModule: TestingModule;
    let sessionsService: SessionsService;
    let mockRequest: MockRequestType;

    beforeEach(() => {
        mockRequest = {
            sessionID: 'mock-session-id',
            session: {
                userId: 'test-user',
                regenerate: jest.fn((cb) => cb && cb()), // simulate successful callback
                destroy: jest.fn((cb) => cb && cb()), // simulate successful callback
            },
        };
    });

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
                HttpLoggerModule.forRootAsync({
                    useFactory: () => ({
                        messages: {
                            console: { silent: true },
                            filesystem: {
                                silent: true,
                            },
                        },
                        requests: {
                            silent: true,
                        },
                    }),
                }),
                RedisModule.forRootAsync({
                    useFactory: () => ({
                        redisAuth: redisContainer.getConnectionUrl(),
                    }),
                }),
                SessionsModule.forRootAsync({
                    useFactory: () => ({
                        cookieMaxAgeMs: 60000,
                        cookieName: 'ssid',
                        cookieSecret: '123',
                        secure: false,
                    }),
                }),
            ],
        }).compile();

        sessionsService = testingModule.get(SessionsService);
    });

    afterAll(async () => {
        await testingModule.close();
    });
});
