import { Controller, FieldValues, Path, useForm } from 'react-hook-form';
import { Field, FieldError, FieldLabel } from '../ui/field';
import { Input } from '../ui/input';
import z, { output } from 'zod';
import { InputHTMLAttributes } from 'react';

type FormInputOptions<SchemaType extends FieldValues> = {
    control: ReturnType<typeof useForm<z.infer<SchemaType>>>['control'];
    placeholder: string;
    formTitle: string;
    name: Path<output<SchemaType>>;
} & Pick<InputHTMLAttributes<unknown>, 'type' | 'minLength' | 'maxLength' | 'autoComplete'>;

export function FormInput<SchemaType extends FieldValues>(opts: FormInputOptions<SchemaType>) {
    return (
        <Controller
            name={opts.name}
            control={opts.control}
            render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`form-${opts.name}`}>{opts.formTitle}</FieldLabel>
                    <Input
                        {...field}
                        id={`form-${opts.name}`}
                        aria-invalid={fieldState.invalid}
                        placeholder={opts.placeholder}
                        autoComplete={opts.autoComplete}
                        type={opts.type ?? 'text'}
                        minLength={opts.minLength}
                        maxLength={opts.maxLength}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
            )}
        />
    );
}
