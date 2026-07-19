import { Injectable } from '@nestjs/common';
import { EmailClient } from '../client/email.client';
import { HealthIndicatorService } from '@nestjs/terminus';

@Injectable()
export class EmailHealthIndicator {
    constructor(
        private readonly emailClient: EmailClient,
        private readonly healthIndicatorService: HealthIndicatorService,
    ) {}

    async isHealthy(key: string) {
        const indicator = this.healthIndicatorService.check(key);
        try {
            await this.emailClient.verifyOrThrow();
            return indicator.up();
        } catch (error) {
            return indicator.down(String(error));
        }
    }
}
