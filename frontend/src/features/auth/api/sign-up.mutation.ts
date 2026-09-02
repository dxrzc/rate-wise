import { SignUpMutation, SignUpMutationVariables } from '@/types/__generated__/graphql';
import { gql, TypedDocumentNode } from '@apollo/client';

export const SIGN_UP: TypedDocumentNode<SignUpMutation, SignUpMutationVariables> = gql`
    mutation SignUp($userData: SignUpInput!) {
        signUp(user_data: $userData) {
            email
        }
    }
`;
