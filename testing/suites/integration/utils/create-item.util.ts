import { ItemModel } from 'src/items/models/item.model';
import { testKit } from './test-kit.util';

export async function createItem(userId: string): Promise<ItemModel> {
    const itemData = testKit.itemSeed.item;
    const created = await testKit.itemRepos.save({ ...itemData, user: { id: userId } });
    return created;
}
