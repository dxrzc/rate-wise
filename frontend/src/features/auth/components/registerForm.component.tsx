'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Field } from '@/components/ui/field';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { registerSchema } from '../schemas/register.schema';
import { FormInput } from '@/components/form/formInput';
import { REGISTER_POLICY } from '../policy/register.policy';
import { useRegister } from '../hooks/useRegister.hook';
import { useRouter } from 'next/navigation';
import { ErrorAlert } from '@/components/errors/error-alert.component';

export function RegisterForm() {
    const router = useRouter();
    const form = useForm<z.infer<typeof registerSchema>>({
        resolver: zodResolver(registerSchema),
        defaultValues: {
            email: '',
            password: '',
            username: '',
        },
    });

    const { handleRegister } = useRegister();

    const onSubmit = async ({ email, password, username }: z.infer<typeof registerSchema>) => {
        const errorMessage = await handleRegister({ email, password, username });
        if (errorMessage) {
            form.setError('root', { message: errorMessage });
        } else {
            router.push('/verify-account');
        }
    };

    return (
        <Card className="w-full sm:max-w-md">
            <CardHeader>
                <CardTitle>Sign up for Ratewise</CardTitle>
            </CardHeader>
            <CardContent>
                <form id="sign-up-form" onSubmit={form.handleSubmit(onSubmit)}>
                    <div className="flex flex-col gap-4">
                        {form.formState.errors.root && (
                            <ErrorAlert message={form.formState.errors.root.message!}></ErrorAlert>
                        )}

                        <FormInput<typeof registerSchema>
                            name={'username'}
                            control={form.control}
                            formTitle="Username"
                            placeholder="johndoe"
                            minLength={REGISTER_POLICY.USERNAME.MIN}
                            maxLength={REGISTER_POLICY.USERNAME.MAX}
                            autoComplete="off"
                        />
                        <FormInput<typeof registerSchema>
                            name={'email'}
                            control={form.control}
                            formTitle="Email"
                            placeholder="johndoe"
                            type="email"
                            autoComplete="email"
                        />
                        <FormInput<typeof registerSchema>
                            name={'password'}
                            control={form.control}
                            formTitle="Password"
                            placeholder="*********"
                            type="password"
                            minLength={REGISTER_POLICY.PASSWORD.MIN}
                            autoComplete="new-password"
                        />
                    </div>
                </form>
            </CardContent>
            <CardFooter>
                <Field orientation="horizontal">
                    <Button type="submit" form="sign-up-form">
                        Create Account
                    </Button>
                </Field>
            </CardFooter>
        </Card>
    );
}
