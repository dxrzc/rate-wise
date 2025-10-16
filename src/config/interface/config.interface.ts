import { Environment } from 'src/common/enum/environment.enum';

export interface IConfigs {
    NODE_ENV: Environment;
    PORT: number;
    PASSWORD_SALT_ROUNDS: number;
    EMAIL_AUTH_TOKEN_SECRET: string;
    EMAIL_AUTH_TOKEN_EXP: string;
    POSTGRES_URI: string;
    REDIS_AUTH_URI: string;
    REDIS_QUEUES_URI: string;
    SESS_COOKIE_SECRET: string;
    SESS_COOKIE_MAX_AGE_MS: number;
    SESS_COOKIE_NAME: string;
    MAX_USER_SESSIONS: number;
    SMTP_HOST: string;
    SMTP_PORT: number;
    SMTP_USER: string;
    SMTP_PASS: string;
}
