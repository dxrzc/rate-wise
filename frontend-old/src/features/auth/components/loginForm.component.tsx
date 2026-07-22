'use client';

import { Button } from '@/components/ui/button';
import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLogin } from '../hooks/useLogin.hook';
import { ErrorAlert } from '@/components/errors/error-alert.component';
import { getErrorMessage } from '@/utils/get-error-message.util';

export function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { handleLogin, error } = useLogin();

    const onSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;
        const formData = new FormData(e.currentTarget);
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;
        const isSuccess = await handleLogin({ email, password });
        if (isSuccess) {
            const returnTo = searchParams.get('return_to');
            const isSafeRedirect =
                returnTo && returnTo.startsWith('/') && !returnTo.startsWith('//');
            const finalDestination = isSafeRedirect ? returnTo : '/dashboard';
            router.push(finalDestination);
        } else {
            const passwordInput = form.elements.namedItem('password');
            if (passwordInput && passwordInput instanceof HTMLInputElement) {
                passwordInput.value = '';
                passwordInput.focus();
            }
        }
    };

    return (
        <Card className="w-full max-w-sm">
            <CardHeader>
                <CardTitle>Login to your account</CardTitle>
                <CardDescription>Enter your email below to login to your account</CardDescription>
                <CardAction>
                    <Button variant="link" asChild>
                        <Link href="/register">Sign Up</Link>
                    </Button>
                </CardAction>
            </CardHeader>
            <CardContent>
                {error && (
                    <div className="mb-6">
                        <ErrorAlert message={getErrorMessage(error)}></ErrorAlert>
                    </div>
                )}

                <form id="login-form" onSubmit={onSubmit}>
                    <div className="flex flex-col gap-6">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="m@example.com"
                                required
                            />
                        </div>
                        <div className="grid gap-2">
                            <div className="flex items-center">
                                <Label htmlFor="password">Password</Label>
                                <a
                                    href="#"
                                    className="ml-auto inline-block text-sm underline-offset-4 hover:underline"
                                >
                                    Forgot your password?
                                </a>
                            </div>
                            <Input id="password" name="password" type="password" required />
                        </div>
                    </div>
                </form>
            </CardContent>
            <CardFooter className="flex-col gap-2">
                <Button type="submit" className="w-full" form="login-form">
                    Login
                </Button>
            </CardFooter>
        </Card>
    );
}
