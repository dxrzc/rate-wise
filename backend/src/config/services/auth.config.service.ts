import { IConfigs } from '../interface/config.interface';
import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { StringValue } from 'src/common/types/string-value.type';

@Injectable()
export class AuthConfigService {
    constructor(private readonly configService: ConfigService<IConfigs, true>) {}

    get accountVerificationTokenExp(): StringValue {
        return this.configService.get('ACCOUNT_VERIFICATION_TOKEN_EXP');
    }

    get accountVerificationTokenSecret(): string {
        return this.configService.get('ACCOUNT_VERIFICATION_TOKEN_SECRET');
    }

    get accountDeletionTokenExp(): StringValue {
        return this.configService.get('ACCOUNT_DELETION_TOKEN_EXP');
    }

    get accountDeletionTokenSecret(): string {
        return this.configService.get('ACCOUNT_DELETION_TOKEN_SECRET');
    }

    get signOutAllTokenSecret(): string {
        return this.configService.get('SIGN_OUT_ALL_TOKEN_SECRET');
    }

    get signOutAllTokenExp(): StringValue {
        return this.configService.get('SIGN_OUT_ALL_TOKEN_EXP');
    }

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
}
