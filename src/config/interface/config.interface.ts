import { Environment } from 'src/common/enum/environment.enum';

export interface IConfigs {
    readonly NODE_ENV: Environment;
    readonly PORT: number;
    readonly CACHE_TTL_SECONDS: number;
    readonly POSTGRES_URI: string;
    readonly REDIS_AUTH_URI: string;
    readonly REDIS_QUEUES_URI: string;
    readonly REDIS_CACHE_URI: string;
    readonly SESS_COOKIE_SECRET: string;
    readonly SESS_COOKIE_MAX_AGE_MS: number;
    readonly SESS_COOKIE_NAME: string;
    readonly MAX_USER_SESSIONS: number;
    readonly SMTP_HOST: string;
    readonly SMTP_PORT: number;
    readonly SMTP_USER: string;
    readonly SMTP_PASS: string;
    readonly API_BASE_URL: string;
    readonly ACCOUNT_VERIFICATION_TOKEN_EXP: string;
    readonly ACCOUNT_VERIFICATION_TOKEN_SECRET: string;
    readonly ACCOUNT_DELETION_TOKEN_EXP: string;
    readonly ACCOUNT_DELETION_TOKEN_SECRET: string;
    readonly SIGN_OUT_ALL_TOKEN_EXP: string;
    readonly SIGN_OUT_ALL_TOKEN_SECRET: string;
    readonly TRUST_PROXY: number;
    readonly ADMIN_USERNAME: string;
    readonly ADMIN_EMAIL: string;
    readonly ADMIN_PASSWORD: string;
}
