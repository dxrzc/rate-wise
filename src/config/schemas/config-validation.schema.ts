import * as Joi from 'joi';
import { Environment } from 'src/common/enum/environment.enum';

export const configValidationSchema = Joi.object({
    PORT: Joi.number().port().default(3000),

    // Dbs
    POSTGRES_URI: Joi.string().uri().required(),
    REDIS_URI: Joi.string().uri().required(),

    // Auth
    COOKIE_SECRET: Joi.string().required(),
    COOKIE_MAX_AGE_MS: Joi.number().integer().positive().required(),
    MAX_USER_SESSIONS: Joi.number().integer().positive().required(),
    SESSION_COOKIE_NAME: Joi.string().required(),
    BCRYPT_SALT_ROUNDS: Joi.number().integer().required(),

    // SMTP
    SMTP_HOST: Joi.string().required(),
    SMTP_PORT: Joi.number().port().required(),
    SMTP_USER: Joi.string().required(),
    SMTP_PASS: Joi.string().required(),

    NODE_ENV: Joi.string()
        .valid(...Object.values(Environment))
        .required(),
});
