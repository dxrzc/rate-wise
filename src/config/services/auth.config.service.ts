import { IConfigs } from '../interface/config.interface';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthConfigService {
    constructor(private readonly configService: ConfigService<IConfigs, true>) {}

    get sessCookieSecret(): string {
        return this.configService.get('SESS_COOKIE_SECRET');
    }

    get sessCookieMaxAgeMs(): number {
        return this.configService.get('SESS_COOKIE_MAX_AGE_MS');
    }

    get sessCookieName(): string {
        return this.configService.get('SESS_COOKIE_NAME');
    }

    get maxUserSessions(): number {
        return this.configService.get('MAX_USER_SESSIONS');
    }

    get passwordSaltRounds(): number {
        return this.configService.get('PASSWORD_SALT_ROUNDS');
    }

    get emailTokenExpTime(): string {
        return this.configService.get('EMAIL_AUTH_TOKEN_EXP');
    }

    get emailTokenSecret(): string {
        return this.configService.get('EMAIL_AUTH_TOKEN_SECRET');
    }
}
