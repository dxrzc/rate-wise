import { LoginForm } from '@/features/auth/components/loginForm.component';

export default function LoginPage() {
    return (
        <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6 md:p-10">
            <LoginForm></LoginForm>
        </div>
    );
}
