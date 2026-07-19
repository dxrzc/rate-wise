import { faker } from '@faker-js/faker/.';
import { createAccount } from '@integration/utils/create-account.util';
import { createItem } from '@integration/utils/create-item.util';
import { success } from '@integration/utils/no-errors.util';
import { testKit } from '@integration/utils/test-kit.util';
import { findItemById } from '@testing/tools/gql-operations/items/find-by-id.operation';
import { Code } from 'src/common/enums/code.enum';
import { createItemCacheKey } from 'src/items/cache/create-cache-key';
import { ITEMS_MESSAGES } from 'src/items/messages/items.messages';

describe('Gql - findItemById', () => {
    describe('Invalid postgres id', () => {
        test('return not found code and item not found error message', async () => {
            const id = faker.food.vegetable();
            const response = await testKit.gqlClient.send(
                findItemById({ fields: ['id'], args: id }),
            );
            expect(response).toFailWith(Code.NOT_FOUND, ITEMS_MESSAGES.NOT_FOUND);
        });
    });

    describe('Item not found', () => {
        test('return not found code and item not found error message', async () => {
            const { id } = await createAccount();
            const { id: itemId } = await createItem(id);
            // delete item
            await testKit.itemRepos.delete({ id: itemId });
            const response = await testKit.gqlClient.send(
                findItemById({ fields: ['id'], args: itemId }),
            );
            expect(response).toFailWith(Code.NOT_FOUND, ITEMS_MESSAGES.NOT_FOUND);
        });
    });

    describe('Item found was not in cache', () => {
        test('store item in cache', async () => {
            const { id } = await createAccount();
            const { id: itemId } = await createItem(id);
            const cacheKey = createItemCacheKey(itemId);
            await testKit.gqlClient
                .send(findItemById({ fields: ['id'], args: itemId }))
                .expect(success);
            const itemInCache = await testKit.cacheManager.get(cacheKey);
            expect(itemInCache).toBeDefined();
        });

        test('return item in database', async () => {
            const { id } = await createAccount();
            const item = await createItem(id);
            const res = await testKit.gqlClient
                .send(findItemById({ fields: 'ALL', args: item.id }))
                .expect(success);
            expect(res.body.data.findItemById).toEqual({
                ...item,
                averageRating: 0,
                createdAt: item?.createdAt.toISOString(),
                updatedAt: item?.updatedAt.toISOString(),
            });
        });
    });

    describe('Item found was in cache', () => {
        test('return item from cache', async () => {
            const { id } = await createAccount();
            const item = await createItem(id);
            const cacheKey = createItemCacheKey(item.id);
            // save item in cache
            await testKit.cacheManager.set(cacheKey, item);
            // second request should hit cache
            const res = await testKit.gqlClient
                .send(findItemById({ fields: ['title'], args: item.id }))
                .expect(success);
            expect(res.body.data.findItemById.title).toBe(item.title);
        });
    });
});
