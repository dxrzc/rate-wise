import { Environment } from 'src/common/enums/environment.enum';
import { IConfigs } from '../interface/config.interface';
import * as Joi from 'joi';
export const envSchema = Joi.object<IConfigs, true>({
    // Db
    POSTGRES_URI: Joi.string().uri().required(),
    REDIS_AUTH_URI: Joi.string().uri().required(),
    REDIS_QUEUES_URI: Joi.string().uri().required(),
    REDIS_CACHE_URI: Joi.string().uri().required(),
    // Auth
    SESS_COOKIE_SECRET: Joi.string().required(),
    SESS_COOKIE_MAX_AGE_MS: Joi.number().integer().positive().required(),
    SESS_COOKIE_NAME: Joi.string().required(),
    MAX_USER_SESSIONS: Joi.number().integer().positive().required(),
    ACCOUNT_VERIFICATION_TOKEN_EXP: Joi.string().required(),
    ACCOUNT_VERIFICATION_TOKEN_SECRET: Joi.string().required(),
    ACCOUNT_DELETION_TOKEN_EXP: Joi.string().required(),
    ACCOUNT_DELETION_TOKEN_SECRET: Joi.string().required(),
    SIGN_OUT_ALL_TOKEN_EXP: Joi.string().required(),
    SIGN_OUT_ALL_TOKEN_SECRET: Joi.string().required(),
    // SMTP
    SMTP_HOST: Joi.string().hostname().optional(),
    SMTP_PORT: Joi.number().port().optional(),
    SMTP_USER: Joi.string().optional(),
    SMTP_PASS: Joi.string().optional(),
    EMAIL_SENDER_ADDRESS: Joi.string().optional(),
    BREVO_API_KEY: Joi.string().optional(), // currently, only for prod
    // App
    PORT: Joi.number().port().default(3000),
    NODE_ENV: Joi.string()
        .valid(...Object.values(Environment))
        .required(),
    API_BASE_URL: Joi.string().uri().required(),
    CACHE_TTL_SECONDS: Joi.number().positive().required(),
    TRUST_PROXY: Joi.number().positive().less(3).default(1),
    // Admin
    ADMIN_USERNAME: Joi.string().required(),
    ADMIN_EMAIL: Joi.string().email().required(),
    ADMIN_PASSWORD: Joi.string().required(),
});
