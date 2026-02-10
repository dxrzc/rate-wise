import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IConfigs } from '../interface/config.interface';

@Injectable()
export class AdminConfigService {
    constructor(private readonly configService: ConfigService<IConfigs, true>) {}

    get username(): string {
        return this.configService.get('ADMIN_USERNAME', { infer: true });
    }

    get email(): string {
        return this.configService.get('ADMIN_EMAIL', { infer: true });
    }

    get password(): string {
        return this.configService.get('ADMIN_PASSWORD', { infer: true });
    }
}
