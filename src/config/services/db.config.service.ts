import { IConfigs } from '../interface/config.interface';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DbConfigService {
    constructor(
        private readonly configService: ConfigService<IConfigs, true>,
    ) {}

    get postgresUri(): string {
        return this.configService.get('POSTGRES_URI');
    }

    get redisAuthUri(): string {
        return this.configService.get('REDIS_AUTH_URI');
    }

    get redisQueuesUri(): string {
        return this.configService.get('REDIS_QUEUES_URI');
    }
}
