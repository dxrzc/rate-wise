import { useMutation } from '@apollo/client/react';
import { CREATE_ITEM } from '../api/create-item.mutation';
import { CreateItemMutation, CreateItemMutationVariables } from '@/types/__generated__/graphql';
import { CreateItemData } from '../types/createItemData.type';

export function useCreateItem() {
    const [createItemAction, { data, error, loading }] = useMutation<
        CreateItemMutation,
        CreateItemMutationVariables
    >(CREATE_ITEM);

    const handleCreateItem = async (itemData: CreateItemData): Promise<boolean> => {
        const response = await createItemAction({
            variables: {
                item_data: {
                    title: itemData.title,
                    description: itemData.description,
                    category: itemData.category,
                    tags: itemData.tags,
                },
            },
        });
        if (!response.error) return true;
        return false;
    };

    return { handleCreateItem, data, error, loading };
}
