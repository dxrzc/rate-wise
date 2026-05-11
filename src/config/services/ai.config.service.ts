import { ConfigService } from '@nestjs/config';
import { IConfigs } from '../interface/config.interface';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AIConfigService {
    constructor(private readonly configService: ConfigService<IConfigs, true>) {}

    get aiProviderToken(): string {
        return this.configService.get('AI_PROVIDER_TOKEN');
    }

    get provider(): string {
        return this.configService.get('AI_PROVIDER');
    }
}
