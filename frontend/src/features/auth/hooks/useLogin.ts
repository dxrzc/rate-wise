import { useMutation } from '@apollo/client/react';
import { SIGN_IN } from '../api/sign-in.mutation';
import { SignInMutation, SignInMutationVariables } from '@/types/__generated__/graphql';
import { LoginData } from '../types/loginData.type';

// TODO: validation
export function useLogin() {
    const [loginAction, { data, error }] = useMutation<SignInMutation, SignInMutationVariables>(
        SIGN_IN,
    );

    const handleLogin = async ({ email, password }: LoginData): Promise<boolean> => {
        const response = await loginAction({
            variables: {
                credentials: {
                    password,
                    email,
                },
            },
        });
        if (!response.error) return true;
        return false;
    };

    return { handleLogin, data, error };
}
