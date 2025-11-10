import { Environment } from 'src/common/enum/environment.enum';

export interface IConfigs {
    NODE_ENV: Environment;
    PORT: number;
    PASSWORD_SALT_ROUNDS: number;
    POSTGRES_URI: string;
    REDIS_AUTH_URI: string;
    REDIS_QUEUES_URI: string;
    REDIS_CACHE_URI: string;
    SESS_COOKIE_SECRET: string;
    SESS_COOKIE_MAX_AGE_MS: number;
    SESS_COOKIE_NAME: string;
    MAX_USER_SESSIONS: number;
    SMTP_HOST: string;
    SMTP_PORT: number;
    SMTP_USER: string;
    SMTP_PASS: string;
    API_BASE_URL: string;
    ACCOUNT_VERIFICATION_TOKEN_EXP: string;
    ACCOUNT_VERIFICATION_TOKEN_SECRET: string;
    ACCOUNT_DELETION_TOKEN_EXP: string;
    ACCOUNT_DELETION_TOKEN_SECRET: string;
}
