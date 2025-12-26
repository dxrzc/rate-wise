import { createAccount } from '@integration/utils/create-account.util';
import { createReview } from '@integration/utils/create-review.util';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { testKit } from '@integration/utils/test-kit.util';
import { Item } from 'src/items/entities/item.entity';
import { success } from '@integration/utils/no-errors.util';
import { createItemCacheKey } from 'src/items/cache/create-cache-key';
import { ITEMS_LIMITS } from 'src/items/constants/items.constants';
import { Code } from 'src/common/enum/code.enum';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';

// skipped intentionally. There are plans to change the way the data is filtered so this tests will be removed anyway.
describe.skip('Gql - findAllItemsByCategory', () => {
    const targetCategory = 'test-category';

    beforeAll(async () => {
        await testKit.seedService.createUsers(2);
        await testKit.seedService.createItems(3);
    });

    async function createItemWithCategory(userId: string, category: string): Promise<Item> {
        const itemData = testKit.itemSeed.itemInput;
        return await testKit.itemRepos.save({
            ...itemData,
            category,
            createdBy: userId,
        });
    }

    async function createItemsWithCategory(
        userId: string,
        category: string,
        itemsNumber: number = 4,
    ): Promise<Item[]> {
        const promises = new Array<Promise<Item>>();
        for (let i = 0; i < itemsNumber; i++) {
            promises.push(createItemWithCategory(userId, category));
        }
        return await Promise.all(promises);
    }

    test('return only the items in specified category', async () => {
        const { id } = await createAccount({ status: AccountStatus.ACTIVE });
        const itemsN = 4;
        const categoryItems = await createItemsWithCategory(id, targetCategory, itemsN);
        // Create some items in different category
        await createItemsWithCategory(id, 'other-category', 2);

        const response = await testKit.gqlClient.expect(success).send({
            query: `query FindAllItemsByCategory($limit: Int!, $category: String!) {
                      findAllItemsByCategory(limit: $limit, category: $category) {
                        nodes {
                          id
                          category
                        }
                      }
                    }`,
            variables: { limit: 10, category: targetCategory },
        });
        const nodes = <Item[]>response.body.data.findAllItemsByCategory.nodes;
        expect(nodes).toBeDefined();
        const idsInNodes = nodes.map((i) => i.id);
        expect(idsInNodes).toEqual(expect.arrayContaining(categoryItems.map((i) => i.id)));
        expect(idsInNodes).toHaveLength(categoryItems.length);
        // Verify all returned items have the correct category
        for (const node of nodes) {
            expect(node.category).toBe(targetCategory);
        }
    });

    test('total count should match the number of items in category', async () => {
        const { id } = await createAccount({ status: AccountStatus.ACTIVE });
        const categoryForCount = 'count-category';
        const itemsInCategory = 4;
        await createItemsWithCategory(id, categoryForCount, itemsInCategory);
        const response = await testKit.gqlClient.expect(success).send({
            query: `query FindAllItemsByCategory($limit: Int!, $category: String!) {
                      findAllItemsByCategory(limit: $limit, category: $category) {
                        totalCount
                      }
                    }`,
            variables: { limit: 1, category: categoryForCount },
        });
        const totalCountInResponse = response.body.data.findAllItemsByCategory.totalCount;
        expect(totalCountInResponse).toBe(itemsInCategory);
    });

    test('cache the results', async () => {
        const { id } = await createAccount({ status: AccountStatus.ACTIVE });
        const categoryForCache = 'cache-category';
        const itemsN = 3;
        const categoryItems = await createItemsWithCategory(id, categoryForCache, itemsN);
        // query all items by category
        await testKit.gqlClient.expect(success).send({
            query: `query FindAllItemsByCategory($limit: Int!, $category: String!) {
                      findAllItemsByCategory(limit: $limit, category: $category) {
                        nodes {
                          id
                        }
                      }
                    }`,
            variables: { limit: itemsN, category: categoryForCache },
        });
        const itemsIds = categoryItems.map((i) => i.id);
        for (const itemId of itemsIds)
            await expect(
                testKit.cacheManager.get(createItemCacheKey(itemId)),
            ).resolves.toBeDefined();
    });

    test('should return items with nested reviews', async () => {
        const { id: userId } = await createAccount({ status: AccountStatus.ACTIVE });
        const { id: reviewerId } = await createAccount({ status: AccountStatus.ACTIVE });
        const nestedReviewsCategory = 'nested-reviews-category';
        const [item] = await createItemsWithCategory(userId, nestedReviewsCategory, 1);

        // Create reviews for the item
        const reviewsCount = 3;
        for (let i = 0; i < reviewsCount; i++) {
            await createReview(item.id, reviewerId);
        }

        const response = await testKit.gqlClient.expect(success).send({
            query: `query FindAllItemsByCategory($limit: Int!, $category: String!) {
                      findAllItemsByCategory(limit: $limit, category: $category) {
                        nodes {
                          id
                          reviews(limit: 10) {
                            nodes {
                              id
                              content
                              rating
                              createdBy
                            }
                            totalCount
                          }
                        }
                      }
                    }`,
            variables: { limit: 1, category: nestedReviewsCategory },
        });

        const nodes = response.body.data.findAllItemsByCategory.nodes;
        expect(nodes).toHaveLength(1);
        const itemNode = nodes[0];
        expect(itemNode.id).toBe(item.id);
        expect(itemNode.reviews.nodes).toHaveLength(reviewsCount);
        expect(itemNode.reviews.totalCount).toBe(reviewsCount);
        expect(itemNode.reviews.nodes[0]).toHaveProperty('content');
        expect(itemNode.reviews.nodes[0]).toHaveProperty('rating');
    });

    test('return empty result when no items in category', async () => {
        const nonExistentCategory = 'non-existent-category-xyz123';
        const response = await testKit.gqlClient.expect(success).send({
            query: `query FindAllItemsByCategory($limit: Int!, $category: String!) {
                      findAllItemsByCategory(limit: $limit, category: $category) {
                        nodes {
                          id
                        }
                        totalCount
                        hasNextPage
                      }
                    }`,
            variables: { limit: 10, category: nonExistentCategory },
        });
        const result = response.body.data.findAllItemsByCategory;
        expect(result.nodes).toEqual([]);
        expect(result.totalCount).toBe(0);
        expect(result.hasNextPage).toBe(false);
    });

    describe('Category input validation', () => {
        test('category is transformed to lowercase and trimmed', async () => {
            const { id } = await createAccount({ status: AccountStatus.ACTIVE });
            const normalizedCategory = 'normalized-cat';
            await createItemsWithCategory(id, normalizedCategory, 1);

            const response = await testKit.gqlClient.expect(success).send({
                query: `query FindAllItemsByCategory($limit: Int!, $category: String!) {
                          findAllItemsByCategory(limit: $limit, category: $category) {
                            nodes {
                              id
                              category
                            }
                          }
                        }`,
                variables: { limit: 1, category: '  NORMALIZED-CAT  ' },
            });
            const nodes = response.body.data.findAllItemsByCategory.nodes;
            expect(nodes).toHaveLength(1);
            expect(nodes[0].category).toBe(normalizedCategory);
        });

        test('return validation error when category is too short', async () => {
            const response = await testKit.gqlClient.send({
                query: `query FindAllItemsByCategory($limit: Int!, $category: String!) {
                          findAllItemsByCategory(limit: $limit, category: $category) {
                            nodes {
                              id
                            }
                          }
                        }`,
                variables: { limit: 1, category: 'ab' }, // less than min 3
            });
            expect(response).toFailWith(Code.BAD_REQUEST, COMMON_MESSAGES.INVALID_INPUT);
        });

        test('return validation error when category is too long', async () => {
            const longCategory = 'a'.repeat(ITEMS_LIMITS.CATEGORY.MAX + 1);
            const response = await testKit.gqlClient.send({
                query: `query FindAllItemsByCategory($limit: Int!, $category: String!) {
                          findAllItemsByCategory(limit: $limit, category: $category) {
                            nodes {
                              id
                            }
                          }
                        }`,
                variables: { limit: 1, category: longCategory },
            });
            expect(response).toFailWith(Code.BAD_REQUEST, COMMON_MESSAGES.INVALID_INPUT);
        });
    });

    describe('Pagination', () => {
        test('should support pagination with cursor', async () => {
            const { id } = await createAccount({ status: AccountStatus.ACTIVE });
            const paginationCategory = 'pagination-category';
            const itemsN = 5;
            await createItemsWithCategory(id, paginationCategory, itemsN);

            // First page
            const firstResponse = await testKit.gqlClient.expect(success).send({
                query: `query FindAllItemsByCategory($limit: Int!, $category: String!) {
                          findAllItemsByCategory(limit: $limit, category: $category) {
                            nodes {
                              id
                            }
                            hasNextPage
                            edges {
                              cursor
                            }
                          }
                        }`,
                variables: { limit: 2, category: paginationCategory },
            });
            const firstResult = firstResponse.body.data.findAllItemsByCategory;
            expect(firstResult.nodes).toHaveLength(2);
            expect(firstResult.hasNextPage).toBe(true);
            const lastCursor = firstResult.edges[firstResult.edges.length - 1].cursor;

            // Second page using cursor
            const secondResponse = await testKit.gqlClient.expect(success).send({
                query: `query FindAllItemsByCategory($limit: Int!, $category: String!, $cursor: String) {
                          findAllItemsByCategory(limit: $limit, category: $category, cursor: $cursor) {
                            nodes {
                              id
                            }
                            hasNextPage
                          }
                        }`,
                variables: { limit: 2, category: paginationCategory, cursor: lastCursor },
            });
            const secondResult = secondResponse.body.data.findAllItemsByCategory;
            expect(secondResult.nodes).toHaveLength(2);
            expect(secondResult.hasNextPage).toBe(true);
        });
    });

    describe('Public access', () => {
        test('operation is accessible without authentication', async () => {
            const response = await testKit.gqlClient.expect(success).send({
                query: `query FindAllItemsByCategory($limit: Int!, $category: String!) {
                          findAllItemsByCategory(limit: $limit, category: $category) {
                            nodes {
                              id
                            }
                          }
                        }`,
                variables: { limit: 1, category: 'any-category' },
            });
            expect(response.body.data.findAllItemsByCategory).toBeDefined();
        });
    });
});
