import {
    RequestAccountVerificationMutation,
    RequestAccountVerificationMutationVariables,
} from '@/types/__generated__/graphql';
import { useMutation } from '@apollo/client/react';
import { REQUEST_ACCOUNT_VERIFICATION } from '../api/request-account-verification.mutation';
import { getErrorMessage } from '@/utils/get-error-message.util';

export function useRequestAccountVerification() {
    const [requestVerification, { loading }] = useMutation<
        RequestAccountVerificationMutation,
        RequestAccountVerificationMutationVariables
    >(REQUEST_ACCOUNT_VERIFICATION);

    const handleRequestVerification = async (): Promise<string | null> => {
        const response = await requestVerification();
        return response.error ? getErrorMessage(response.error) : null;
    };

    return { handleRequestVerification, loading };
}
