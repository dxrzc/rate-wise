import { Alert, AlertTitle } from '../ui/alert';

export function ErrorAlert({ message }: { message: string }) {
    return (
        <Alert variant="destructive" className="max-w-md">
            <AlertTitle>{message}</AlertTitle>
        </Alert>
    );
}
