import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { RedisMonitoringModule } from 'src/redis-monitoring/redis-monitoring.module';

@Module({
    imports: [TerminusModule, RedisMonitoringModule],
    controllers: [HealthController],
})
export class HealthModule {}
