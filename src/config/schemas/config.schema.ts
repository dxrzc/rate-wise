import { Environment } from 'src/common/enum/environment.enum';
import { IConfigs } from '../interface/config.interface';
import * as Joi from 'joi';

export const envSchema = Joi.object<IConfigs, true>({
    // Db
    POSTGRES_URI: Joi.string().uri().required(),
    REDIS_AUTH_URI: Joi.string().uri().required(),
    REDIS_QUEUES_URI: Joi.string().uri().required(),
    // Auth
    SESS_COOKIE_SECRET: Joi.string().required(),
    SESS_COOKIE_MAX_AGE_MS: Joi.number().integer().positive().required(),
    SESS_COOKIE_NAME: Joi.string().required(),
    MAX_USER_SESSIONS: Joi.number().integer().positive().required(),
    PASSWORD_SALT_ROUNDS: Joi.number().integer().positive().required(),
    EMAIL_AUTH_TOKEN_SECRET: Joi.string().required(),
    EMAIL_AUTH_TOKEN_EXP: Joi.string().required(),
    // SMTP
    SMTP_HOST: Joi.string().hostname().required(),
    SMTP_PORT: Joi.number().port().required(),
    SMTP_USER: Joi.string().required(),
    SMTP_PASS: Joi.string().required(),
    // App
    PORT: Joi.number().port().default(3000),
    NODE_ENV: Joi.string()
        .valid(...Object.values(Environment))
        .required(),
    API_BASE_URL: Joi.string().uri().required(),
});
