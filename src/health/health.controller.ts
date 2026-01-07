import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { Public } from 'src/common/decorators/public.decorator';
import { EmailHealthIndicator } from 'src/emails/health/email.health';
import { RedisHealthIndicator } from 'src/redis-monitoring/health/redis.health';

@Controller('health')
export class HealthController {
    constructor(
        private readonly health: HealthCheckService,
        private readonly db: TypeOrmHealthIndicator,
        private readonly email: EmailHealthIndicator,
        private readonly redis: RedisHealthIndicator,
    ) {}

    @Public()
    @Get()
    @HealthCheck()
    check() {
        return this.health.check([
            () => this.db.pingCheck('database'),
            () => this.email.isHealthy('email'),
            () => this.redis.isHealthy('redis'),
        ]);
    }
}
