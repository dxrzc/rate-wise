import { RedisConnection } from 'src/common/redis/redis.connection';
import { createClient } from '@redis/client';

jest.mock('@redis/client');
jest.mock('src/common/logging/system.logger');

describe('RedisConnection', () => {
    let mockClient: any;

    beforeEach(() => {
        jest.clearAllMocks();
        
        mockClient = {
            on: jest.fn(),
            connect: jest.fn(),
            disconnect: jest.fn(),
            duplicate: jest.fn(() => ({
                subscribe: jest.fn(),
                connect: jest.fn(),
                disconnect: jest.fn(),
            })),
        };

        (createClient as jest.Mock).mockReturnValue(mockClient);
    });

    describe('reconnectStrategy', () => {
        it('should configure reconnection strategy with no maximum retries', () => {
            new RedisConnection('redis://localhost:6379', 'test');

            expect(createClient).toHaveBeenCalledWith({
                url: 'redis://localhost:6379',
                socket: {
                    reconnectStrategy: expect.any(Function),
                },
            });
        });

        it('should return exponential backoff delay for early retries', () => {
            new RedisConnection('redis://localhost:6379', 'test');

            const createClientCall = (createClient as jest.Mock).mock.calls[0][0];
            const reconnectStrategy = createClientCall.socket.reconnectStrategy;

            // First retry: 2^0 * 50 = 50ms + jitter (0-1000ms)
            const delay0 = reconnectStrategy(0);
            expect(delay0).toBeGreaterThanOrEqual(50);
            expect(delay0).toBeLessThanOrEqual(1050);

            // Second retry: 2^1 * 50 = 100ms + jitter
            const delay1 = reconnectStrategy(1);
            expect(delay1).toBeGreaterThanOrEqual(100);
            expect(delay1).toBeLessThanOrEqual(1100);

            // Third retry: 2^2 * 50 = 200ms + jitter
            const delay2 = reconnectStrategy(2);
            expect(delay2).toBeGreaterThanOrEqual(200);
            expect(delay2).toBeLessThanOrEqual(1200);
        });

        it('should cap reconnection delay at 30 seconds', () => {
            new RedisConnection('redis://localhost:6379', 'test');

            const createClientCall = (createClient as jest.Mock).mock.calls[0][0];
            const reconnectStrategy = createClientCall.socket.reconnectStrategy;

            // High retry count should be capped at 30000ms + jitter (0-1000ms)
            const delay = reconnectStrategy(100);
            expect(delay).toBeGreaterThanOrEqual(30000);
            expect(delay).toBeLessThanOrEqual(31000);
        });

        it('should never return false (unlimited retries)', () => {
            new RedisConnection('redis://localhost:6379', 'test');

            const createClientCall = (createClient as jest.Mock).mock.calls[0][0];
            const reconnectStrategy = createClientCall.socket.reconnectStrategy;

            // Test various retry counts
            for (let retries = 0; retries < 1000; retries += 100) {
                const result = reconnectStrategy(retries);
                expect(result).not.toBe(false);
                expect(typeof result).toBe('number');
            }
        });

        it('should add jitter to prevent thundering herd', () => {
            new RedisConnection('redis://localhost:6379', 'test');

            const createClientCall = (createClient as jest.Mock).mock.calls[0][0];
            const reconnectStrategy = createClientCall.socket.reconnectStrategy;

            // Call multiple times with the same retry count
            const delays: number[] = [];
            for (let i = 0; i < 10; i++) {
                delays.push(reconnectStrategy(5));
            }

            // Due to jitter, not all delays should be the same
            const uniqueDelays = new Set(delays);
            // With 10 calls and random jitter from 0-1000ms, we should get some variation
            // This is a probabilistic test, but should pass with high confidence
            expect(uniqueDelays.size).toBeGreaterThan(1);
        });
    });

    describe('connection lifecycle', () => {
        it('should configure event handlers on creation', () => {
            new RedisConnection('redis://localhost:6379', 'test');

            expect(mockClient.on).toHaveBeenCalledWith('error', expect.any(Function));
            expect(mockClient.on).toHaveBeenCalledWith('reconnecting', expect.any(Function));
        });

        it('should connect to Redis', async () => {
            const connection = new RedisConnection('redis://localhost:6379', 'test');

            await connection.connect();

            expect(mockClient.connect).toHaveBeenCalled();
        });

        it('should disconnect from Redis', async () => {
            const connection = new RedisConnection('redis://localhost:6379', 'test');

            await connection.disconnect();

            expect(mockClient.disconnect).toHaveBeenCalled();
        });
    });
});
