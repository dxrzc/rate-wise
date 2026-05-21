'use client';
import { ErrorAlert } from '@/components/errors/error-alert.component';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useRequestAccountVerification } from '../hooks/useRequestAccountVerification.hook';

export function VerifyAccountForm() {
    const router = useRouter();
    const { handleRequestVerification, loading } = useRequestAccountVerification();
    const [serverError, setServerError] = useState<string | null>(null);

    const onResend = async () => {
        const errorMessage = await handleRequestVerification();
        if (errorMessage) {
            setServerError(errorMessage);
        } else {
            setServerError(null);
        }
    };

    return (
        <Card className="w-full sm:max-w-md">
            <CardHeader>
                <CardTitle>Verify your account</CardTitle>
                <CardDescription>
                    We sent a verification email to your inbox. Please check your email and follow
                    the instructions.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
                {serverError && <ErrorAlert message={serverError} />}
                <Button onClick={onResend} disabled={loading} variant="outline">
                    {loading ? 'Sending...' : 'Send Email'}
                </Button>
                <Button variant="link" onClick={() => router.push('/login')}>
                    Back to login
                </Button>
            </CardContent>
        </Card>
    );
}
