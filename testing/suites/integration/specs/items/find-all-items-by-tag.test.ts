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
describe.skip('Gql - findAllItemsByTag', () => {
    const targetTag = 'test-tag';

    beforeAll(async () => {
        await testKit.seedService.createUsers(2);
        await testKit.seedService.createItems(3);
    });

    async function createItemWithTags(userId: string, tags: string[]): Promise<Item> {
        const itemData = testKit.itemSeed.itemInput;
        return await testKit.itemRepos.save({
            ...itemData,
            tags,
            createdBy: userId,
        });
    }

    async function createItemsWithTag(
        userId: string,
        tag: string,
        itemsNumber: number = 4,
    ): Promise<Item[]> {
        const promises = new Array<Promise<Item>>();
        for (let i = 0; i < itemsNumber; i++) {
            promises.push(createItemWithTags(userId, [tag, `other-tag-${i}`]));
        }
        return await Promise.all(promises);
    }

    test('return only the items containing the specified tag', async () => {
        const { id } = await createAccount({ status: AccountStatus.ACTIVE });
        const itemsN = 4;
        const tagItems = await createItemsWithTag(id, targetTag, itemsN);
        // Create some items without the target tag
        await createItemsWithTag(id, 'different-tag', 2);

        const response = await testKit.gqlClient.expect(success).send({
            query: `query FindAllItemsByTag($limit: Int!, $tag: String!) {
                      findAllItemsByTag(limit: $limit, tag: $tag) {
                        nodes {
                          id
                          tags
                        }
                      }
                    }`,
            variables: { limit: 10, tag: targetTag },
        });
        const nodes = <Item[]>response.body.data.findAllItemsByTag.nodes;
        expect(nodes).toBeDefined();
        const idsInNodes = nodes.map((i) => i.id);
        expect(idsInNodes).toEqual(expect.arrayContaining(tagItems.map((i) => i.id)));
        expect(idsInNodes).toHaveLength(tagItems.length);
        // Verify all returned items contain the correct tag
        for (const node of nodes) {
            expect(node.tags).toContain(targetTag);
        }
    });

    test('total count should match the number of items with the tag', async () => {
        const { id } = await createAccount({ status: AccountStatus.ACTIVE });
        const tagForCount = 'count-tag';
        const itemsWithTag = 4;
        await createItemsWithTag(id, tagForCount, itemsWithTag);
        const response = await testKit.gqlClient.expect(success).send({
            query: `query FindAllItemsByTag($limit: Int!, $tag: String!) {
                      findAllItemsByTag(limit: $limit, tag: $tag) {
                        totalCount
                      }
                    }`,
            variables: { limit: 1, tag: tagForCount },
        });
        const totalCountInResponse = response.body.data.findAllItemsByTag.totalCount;
        expect(totalCountInResponse).toBe(itemsWithTag);
    });

    test('cache the results', async () => {
        const { id } = await createAccount({ status: AccountStatus.ACTIVE });
        const tagForCache = 'cache-tag';
        const itemsN = 3;
        const tagItems = await createItemsWithTag(id, tagForCache, itemsN);
        // query all items by tag
        await testKit.gqlClient.expect(success).send({
            query: `query FindAllItemsByTag($limit: Int!, $tag: String!) {
                      findAllItemsByTag(limit: $limit, tag: $tag) {
                        nodes {
                          id
                        }
                      }
                    }`,
            variables: { limit: itemsN, tag: tagForCache },
        });
        const itemsIds = tagItems.map((i) => i.id);
        for (const itemId of itemsIds)
            await expect(
                testKit.cacheManager.get(createItemCacheKey(itemId)),
            ).resolves.toBeDefined();
    });

    test('should return items with nested reviews', async () => {
        const { id: userId } = await createAccount({ status: AccountStatus.ACTIVE });
        const { id: reviewerId } = await createAccount({ status: AccountStatus.ACTIVE });
        const nestedReviewsTag = 'nested-reviews-tag';
        const [item] = await createItemsWithTag(userId, nestedReviewsTag, 1);

        // Create reviews for the item
        const reviewsCount = 3;
        for (let i = 0; i < reviewsCount; i++) {
            await createReview(item.id, reviewerId);
        }

        const response = await testKit.gqlClient.expect(success).send({
            query: `query FindAllItemsByTag($limit: Int!, $tag: String!) {
                      findAllItemsByTag(limit: $limit, tag: $tag) {
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
            variables: { limit: 1, tag: nestedReviewsTag },
        });

        const nodes = response.body.data.findAllItemsByTag.nodes;
        expect(nodes).toHaveLength(1);
        const itemNode = nodes[0];
        expect(itemNode.id).toBe(item.id);
        expect(itemNode.reviews.nodes).toHaveLength(reviewsCount);
        expect(itemNode.reviews.totalCount).toBe(reviewsCount);
        expect(itemNode.reviews.nodes[0]).toHaveProperty('content');
        expect(itemNode.reviews.nodes[0]).toHaveProperty('rating');
    });

    test('return empty result when no items have the tag', async () => {
        const nonExistentTag = 'nonexistent-tag';
        const response = await testKit.gqlClient.expect(success).send({
            query: `query FindAllItemsByTag($limit: Int!, $tag: String!) {
                      findAllItemsByTag(limit: $limit, tag: $tag) {
                        nodes {
                          id
                        }
                        totalCount
                        hasNextPage
                      }
                    }`,
            variables: { limit: 10, tag: nonExistentTag },
        });
        const result = response.body.data.findAllItemsByTag;
        expect(result.nodes).toEqual([]);
        expect(result.totalCount).toBe(0);
        expect(result.hasNextPage).toBe(false);
    });

    describe('Tag input validation', () => {
        test('tag is transformed to lowercase and trimmed', async () => {
            const { id } = await createAccount({ status: AccountStatus.ACTIVE });
            const normalizedTag = 'normalized-tag';
            await createItemsWithTag(id, normalizedTag, 1);

            const response = await testKit.gqlClient.expect(success).send({
                query: `query FindAllItemsByTag($limit: Int!, $tag: String!) {
                          findAllItemsByTag(limit: $limit, tag: $tag) {
                            nodes {
                              id
                              tags
                            }
                          }
                        }`,
                variables: { limit: 1, tag: '  NORMALIZED-TAG  ' },
            });
            const nodes = response.body.data.findAllItemsByTag.nodes;
            expect(nodes).toHaveLength(1);
            expect(nodes[0].tags).toContain(normalizedTag);
        });

        test('return validation error when tag is too short', async () => {
            const response = await testKit.gqlClient.send({
                query: `query FindAllItemsByTag($limit: Int!, $tag: String!) {
                          findAllItemsByTag(limit: $limit, tag: $tag) {
                            nodes {
                              id
                            }
                          }
                        }`,
                variables: { limit: 1, tag: 'a' }, // less than min 2
            });
            expect(response).toFailWith(Code.BAD_REQUEST, COMMON_MESSAGES.INVALID_INPUT);
        });

        test('return validation error when tag is too long', async () => {
            const longTag = 'a'.repeat(ITEMS_LIMITS.TAGS.TAG_MAX_LENGTH + 1);
            const response = await testKit.gqlClient.send({
                query: `query FindAllItemsByTag($limit: Int!, $tag: String!) {
                          findAllItemsByTag(limit: $limit, tag: $tag) {
                            nodes {
                              id
                            }
                          }
                        }`,
                variables: { limit: 1, tag: longTag },
            });
            expect(response).toFailWith(Code.BAD_REQUEST, COMMON_MESSAGES.INVALID_INPUT);
        });
    });

    describe('Pagination', () => {
        test('should support pagination with cursor', async () => {
            const { id } = await createAccount({ status: AccountStatus.ACTIVE });
            const paginationTag = 'pagination-tag';
            const itemsN = 5;
            await createItemsWithTag(id, paginationTag, itemsN);

            // First page
            const firstResponse = await testKit.gqlClient.expect(success).send({
                query: `query FindAllItemsByTag($limit: Int!, $tag: String!) {
                          findAllItemsByTag(limit: $limit, tag: $tag) {
                            nodes {
                              id
                            }
                            hasNextPage
                            edges {
                              cursor
                            }
                          }
                        }`,
                variables: { limit: 2, tag: paginationTag },
            });
            const firstResult = firstResponse.body.data.findAllItemsByTag;
            expect(firstResult.nodes).toHaveLength(2);
            expect(firstResult.hasNextPage).toBe(true);
            const lastCursor = firstResult.edges[firstResult.edges.length - 1].cursor;

            // Second page using cursor
            const secondResponse = await testKit.gqlClient.expect(success).send({
                query: `query FindAllItemsByTag($limit: Int!, $tag: String!, $cursor: String) {
                          findAllItemsByTag(limit: $limit, tag: $tag, cursor: $cursor) {
                            nodes {
                              id
                            }
                            hasNextPage
                          }
                        }`,
                variables: { limit: 2, tag: paginationTag, cursor: lastCursor },
            });
            const secondResult = secondResponse.body.data.findAllItemsByTag;
            expect(secondResult.nodes).toHaveLength(2);
            expect(secondResult.hasNextPage).toBe(true);
        });
    });

    describe('Public access', () => {
        test('operation is accessible without authentication', async () => {
            const response = await testKit.gqlClient.expect(success).send({
                query: `query FindAllItemsByTag($limit: Int!, $tag: String!) {
                          findAllItemsByTag(limit: $limit, tag: $tag) {
                            nodes {
                              id
                            }
                          }
                        }`,
                variables: { limit: 1, tag: 'any-tag' },
            });
            expect(response.body.data.findAllItemsByTag).toBeDefined();
        });
    });
});
