import { gql } from '@apollo/client';

// TODO: do i need all this data?
export const SIGN_IN = gql`
    mutation SignIn($credentials: SignInInput!) {
        signIn(credentials: $credentials) {
            id
            createdAt
            updatedAt
            username
            email
            roles
            status
        }
    }
`;
