import { gql } from '@apollo/client';

export const SIGN_UP = gql`
    mutation SignUp($userData: SignUpInput!) {
        signUp(user_data: $userData) {
            email
        }
    }
`;
