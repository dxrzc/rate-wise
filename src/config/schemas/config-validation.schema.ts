import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
    PORT: Joi.number().port().default(3000),
    POSTGRES_URI: Joi.string().uri().required(),
    REDIS_URI: Joi.string().uri().required(),
    COOKIE_SECRET: Joi.string().required(),
    COOKIE_MAX_AGE: Joi.number().integer().positive().required(),
    NODE_ENV: Joi.string()
        .valid('development', 'integration', 'e2e')
        .required(),
});
