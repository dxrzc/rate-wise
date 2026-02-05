import { IConfigs } from '../interface/config.interface';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { Environment } from 'src/common/enums/environment.enum';

@Injectable()
export class ServerConfigService {
    constructor(private readonly configService: ConfigService<IConfigs, true>) {}

    get port(): number {
        return this.configService.get('PORT');
    }

    get env(): Environment {
        return this.configService.get('NODE_ENV');
    }

    get isProduction(): boolean {
        return this.env === Environment.PRODUCTION;
    }

    get isDevelopment(): boolean {
        return this.env === Environment.DEVELOPMENT;
    }

    get isTesting(): boolean {
        return this.env === Environment.INTEGRATION;
    }

    get apiBaseUrl(): string {
        return this.configService.get('API_BASE_URL');
    }

    get cacheTtlSeconds(): number {
        return this.configService.get('CACHE_TTL_SECONDS');
    }

    get trustProxy(): number {
        return this.configService.get('TRUST_PROXY');
    }
}
