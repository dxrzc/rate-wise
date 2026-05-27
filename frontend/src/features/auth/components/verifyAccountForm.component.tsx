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
                    We will send you an email with a link to verify your account. If you have not
                    received the email, click the button below to resend it.
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
