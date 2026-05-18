import { useMutation } from '@apollo/client/react';
import { SIGN_IN } from '../api/sign-in.mutation';
import { SignInMutation, SignInMutationVariables } from '@/types/__generated__/graphql';

// TODO: validation
export function useLogin() {
    const [loginAction, { data, error }] = useMutation<SignInMutation, SignInMutationVariables>(
        SIGN_IN,
    );

    const handleLogin = (e: React.SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const email = <string>formData.get('email');
        const password = <string>formData.get('password');
        loginAction({
            variables: {
                credentials: {
                    password,
                    email,
                },
            },
        });
        console.log({ returnData: data });
        console.error({ error });
    };

    return { handleLogin, data, error };
}
