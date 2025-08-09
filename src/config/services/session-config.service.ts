import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ISessionConfigService } from '../interface/session-config.interface';

@Injectable()
export class SessionConfigService {
    constructor(
        private readonly configService: ConfigService<
            ISessionConfigService,
            true
        >,
    ) {}

    get cookieSecret(): string {
        return this.configService.get('COOKIE_SECRET');
    }

    get cookieMaxAge(): number {
        return this.configService.get('COOKIE_MAX_AGE');
    }

    get maxUserSessions(): number {
        return this.configService.get('MAX_USER_SESSIONS');
    }
}
