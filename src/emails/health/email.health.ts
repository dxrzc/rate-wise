import { Injectable } from '@nestjs/common';
import { EmailsClient } from '../client/emails.client';
import { HealthIndicatorService } from '@nestjs/terminus';

@Injectable()
export class EmailHealthIndicator {
    constructor(
        private readonly emailClient: EmailsClient,
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
