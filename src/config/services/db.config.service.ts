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

    get redisUri(): string {
        return this.configService.get('REDIS_URI');
    }
}
