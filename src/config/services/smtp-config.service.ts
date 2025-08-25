import { ISMTPConfig } from '../interface/smtp-config.interface';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class SMTPConfigService {
    constructor(
        private readonly configService: ConfigService<ISMTPConfig, true>,
    ) {}

    get host(): string {
        return this.configService.get('SMTP_HOST');
    }

    get port(): number {
        return this.configService.get('SMTP_PORT');
    }

    get user(): string {
        return this.configService.get('SMTP_USER');
    }

    get pass(): string {
        return this.configService.get('SMTP_PASS');
    }
}
