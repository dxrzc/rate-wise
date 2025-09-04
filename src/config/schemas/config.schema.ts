import { Environment } from 'src/common/enum/environment.enum';
import { IConfigs } from '../interface/config.interface';
import * as Joi from 'joi';

// Base validations
const NODE_ENV = Joi.string().valid(...Object.values(Environment));
const SESS_COOKIE_MAX_AGE_MS = Joi.number().integer().positive();
const PASSWORD_SALT_ROUNDS = Joi.number().integer().positive();
const MAX_USER_SESSIONS = Joi.number().integer().positive();
const POSTGRES_URI = Joi.string().uri();
const SESS_COOKIE_SECRET = Joi.string();
const SMTP_PORT = Joi.number().port();
const SESS_COOKIE_NAME = Joi.string();
const REDIS_URI = Joi.string().uri();
const SMTP_HOST = Joi.string().hostname();
const PORT = Joi.number().port();
const SMTP_USER = Joi.string();
const SMTP_PASS = Joi.string();

export const envSchema = Joi.object<IConfigs, true>({
    // Db
    POSTGRES_URI: POSTGRES_URI.required(),
    REDIS_URI: REDIS_URI.required(),
    // Auth
    SESS_COOKIE_SECRET: SESS_COOKIE_SECRET.required(),
    SESS_COOKIE_MAX_AGE_MS: SESS_COOKIE_MAX_AGE_MS.required(),
    SESS_COOKIE_NAME: SESS_COOKIE_NAME.required(),
    MAX_USER_SESSIONS: MAX_USER_SESSIONS.required(),
    PASSWORD_SALT_ROUNDS: PASSWORD_SALT_ROUNDS.required(),
    // SMTP
    SMTP_HOST: SMTP_HOST.required(),
    SMTP_PORT: SMTP_PORT.required(),
    SMTP_USER: SMTP_USER.required(),
    SMTP_PASS: SMTP_PASS.required(),
    // App
    PORT: PORT.default(3000),
    NODE_ENV: NODE_ENV.required(),
});

export const integrationEnvSchema = Joi.object<IConfigs, true>({
    // Db
    POSTGRES_URI: POSTGRES_URI.required(),
    REDIS_URI: REDIS_URI.required(),
    // Auth
    SESS_COOKIE_SECRET: SESS_COOKIE_SECRET.default('ABC123'),
    SESS_COOKIE_MAX_AGE_MS: SESS_COOKIE_MAX_AGE_MS.default(600000),
    SESS_COOKIE_NAME: SESS_COOKIE_NAME.default('ssid'),
    MAX_USER_SESSIONS: MAX_USER_SESSIONS.default(3),
    PASSWORD_SALT_ROUNDS: PASSWORD_SALT_ROUNDS.default(1),
    // SMTP
    SMTP_HOST: SMTP_HOST.default('testHost'),
    SMTP_PORT: SMTP_PORT.default(1025),
    SMTP_USER: SMTP_USER.default('testUser'),
    SMTP_PASS: SMTP_PASS.default('testPass'),
    // App
    PORT: PORT.default(3000),
    NODE_ENV: NODE_ENV.default(Environment.INTEGRATION),
});
