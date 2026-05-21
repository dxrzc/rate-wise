import { useMutation } from '@apollo/client/react';
import { SIGN_UP } from '../api/sign-up.mutation';
import { SignUpMutation, SignUpMutationVariables } from '@/types/__generated__/graphql';
import { SignUpData } from '../types/signUpData.type';
import { getErrorMessage } from '@/utils/get-error-message.util';

export function useRegister() {
    const [registerAction, { data, error }] = useMutation<SignUpMutation, SignUpMutationVariables>(
        SIGN_UP,
    );

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
        return response.error ? getErrorMessage(error) : null;
    };

    return { handleRegister, data, error };
}
