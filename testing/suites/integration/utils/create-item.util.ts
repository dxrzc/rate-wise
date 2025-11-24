import { testKit } from './test-kit.util';
import { Item } from 'src/items/entities/item.entity';

/**
 * Creates an item in database with default values
 */
export async function createItem(userId: string): Promise<Item> {
    const itemData = testKit.itemSeed.itemInput;
    const created = await testKit.itemRepos.save({ ...itemData, createdBy: userId });
    return created;
}
