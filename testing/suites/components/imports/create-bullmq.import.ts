import { BullModule } from '@nestjs/bullmq';
import { RedisMemoryServer } from 'redis-memory-server';

// bullmq needs a redis connection no matter what
export async function createBullMQImport() {
    const redisServer = new RedisMemoryServer();
    const host = await redisServer.getHost();
    const port = await redisServer.getPort();
    return {
        import: [BullModule.forRoot({ connection: { host, port } })],
        server: redisServer,
    };
}
