import { Item } from '../entities/item.entity';

export function deserializeItem(data: object): Item {
    const typedData = data as Item;
    return <Item>{
        ...typedData,
        createdAt: new Date(typedData.createdAt),
        updatedAt: new Date(typedData.updatedAt),
    };
}
