import { IConfigs } from '../interface/config.interface';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { Environment } from 'src/common/enum/environment.enum';

@Injectable()
export class ServerConfigService {
    constructor(
        private readonly configService: ConfigService<IConfigs, true>,
    ) {}

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
}
