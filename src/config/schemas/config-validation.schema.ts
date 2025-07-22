import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
    PORT: Joi.number().port().default(3000),
    NODE_ENV: Joi.string()
        .valid('development', 'integration', 'e2e')
        .required(),
});
