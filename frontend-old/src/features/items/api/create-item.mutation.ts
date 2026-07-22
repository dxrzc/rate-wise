import { gql } from '@apollo/client';

export const CREATE_ITEM = gql`
    mutation CreateItem($item_data: CreateItemInput!) {
        createItem(item_data: $item_data) {
            id
        }
    }
`;
