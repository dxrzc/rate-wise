import { RegisterForm } from '@/features/auth/components/registerForm.component';

export default function RegisterPage() {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
            <RegisterForm />
        </div>
    );
}
