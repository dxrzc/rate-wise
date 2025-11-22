import { testKit } from './test-kit.util';
import { Item } from 'src/items/entities/item.entity';

export async function createItem(userId: string): Promise<Item> {
    const itemData = testKit.itemSeed.item;
    const created = await testKit.itemRepos.save({ ...itemData, createdBy: userId });
    return created;
}
