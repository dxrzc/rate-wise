import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';

function extractError(errors: ValidationError[]): string {
    const firstErr = errors.at(0);
    if (!firstErr || !firstErr.constraints)
        throw new Error('Can not identify the properties of validation error');
    const errs = Object.values<string>(firstErr.constraints);
    // Unexpected property
    if (Object.keys(firstErr.constraints).includes('whitelistValidation'))
        errs[0] = 'Unexpected property';
    return errs[0];
}

interface ValidationResult<T extends ClassConstructor<any>> {
    data?: InstanceType<T>;
    error?: string;
}

export async function validateAndTransform<T extends ClassConstructor<any>>(
    cls: T,
    input: object,
): Promise<ValidationResult<T>> {
    const errors = await validate(input, {
        stopAtFirstError: true,
    });
    if (errors.length > 0) {
        const error = extractError(errors);
        return { error };
    }
    const data = plainToInstance<InstanceType<T>, object>(cls, input);
    return { data };
}
