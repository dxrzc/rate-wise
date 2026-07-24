import { useMutation } from '@apollo/client/react';
import { SIGN_UP } from '../api/sign-up.mutation';
import { getErrorMessage } from '@/utils/get-error-message.util';
import { SignUpData } from '../types/signUpData.type.ts';

export function useRegister() {
    const [registerAction, { data }] = useMutation(SIGN_UP);
    const handleRegister = async ({
        username,
        email,
        password,
    }: SignUpData): Promise<string | null> => {
        const response = await registerAction({
            variables: {
                userData: {
                    username,
                    password,
                    email,
                },
            },
        });
        return response.error ? getErrorMessage(response.error) : null;
    };
    return { handleRegister, data };
}
