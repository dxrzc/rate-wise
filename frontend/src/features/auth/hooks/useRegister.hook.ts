import { useMutation } from '@apollo/client/react';
import { SIGN_UP } from '../api/sign-up.mutation';
import { SignUpMutation, SignUpMutationVariables } from '@/types/__generated__/graphql';
import { SignUpData } from '../types/signUpData.type';

export function useRegister() {
    const [registerAction, { data, error }] = useMutation<SignUpMutation, SignUpMutationVariables>(
        SIGN_UP,
    );

    const handleRegister = async ({ username, email, password }: SignUpData): Promise<boolean> => {
        const response = await registerAction({
            variables: {
                userData: {
                    username,
                    password,
                    email,
                },
            },
        });
        if (!response.error) return true;
        return false;
    };

    return { handleRegister, data, error };
}
