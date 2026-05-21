import { gql } from '@apollo/client';

export const REQUEST_ACCOUNT_VERIFICATION = gql`
    mutation RequestAccountVerification {
        requestAccountVerification
    }
`;
