'use client';
import { ErrorAlert } from '@/components/errors/error-alert.component';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useRequestAccountVerification } from '../hooks/useRequestAccountVerification.hook';

export function VerifyAccountForm() {
    const router = useRouter();
    const { handleRequestVerification, loading } = useRequestAccountVerification();
    const [serverError, setServerError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);
    const called = useRef(false);

    useEffect(() => {
        if (called.current) return;
        called.current = true;
        handleRequestVerification().then((errorMessage) => {
            if (errorMessage) setServerError(errorMessage);
            else setSent(true);
        });
    });

    const onResend = async () => {
        const errorMessage = await handleRequestVerification();
        if (errorMessage) {
            setServerError(errorMessage);
        } else {
            setServerError(null);
            setSent(true);
        }
    };

    return (
        <Card className="w-full sm:max-w-md">
            <CardHeader>
                <CardTitle>Verify your account</CardTitle>
                <CardDescription>
                    {sent
                        ? 'We sent a verification email to your inbox. Please check your email and follow the instructions.'
                        : 'We will send you a verification email shortly.'}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                {loading && <p className="text-sm text-muted-foreground">Sending email...</p>}
                {serverError && <ErrorAlert message={serverError} />}
                {sent && (
                    <Button onClick={onResend} disabled={loading} variant="outline">
                        {loading ? 'Sending...' : 'Resend email'}
                    </Button>
                )}
                <Button variant="link" onClick={() => router.push('/login')}>
                    Back to login
                </Button>
            </CardContent>
        </Card>
    );
}
