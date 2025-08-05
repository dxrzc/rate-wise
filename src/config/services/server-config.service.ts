import { ConfigService } from '@nestjs/config';
import { IServerConfig } from '../interface/service-config.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ServerConfigService {
    constructor(
        private readonly configService: ConfigService<IServerConfig, true>,
    ) {}

    get environment(): string {
        return this.configService.get('NODE_ENV');
    }

    get port(): number {
        return this.configService.get('PORT');
    }
}
