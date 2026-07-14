import { VerifyAccountForm } from '@/features/auth/components/verifyAccountForm.component';

export default function VerifyAccountPage() {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
            <VerifyAccountForm />
        </div>
    );
}
