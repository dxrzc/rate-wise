import { ConfigService } from '@nestjs/config';
import { IDatabaseConfig } from '../interface/database-config.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class DatabaseConfigService {
    constructor(
        private readonly configService: ConfigService<IDatabaseConfig, true>,
    ) {}

    get uri(): string {
        // TODO: read from filesystem in production
        return this.configService.get('POSTGRES_URI');
    }
}
