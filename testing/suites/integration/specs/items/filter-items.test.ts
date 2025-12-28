import { faker } from '@faker-js/faker';
import { createAccount } from '@integration/utils/create-account.util';
import { createItem } from '@integration/utils/create-item.util';
import { success } from '@integration/utils/no-errors.util';
import { testKit } from '@integration/utils/test-kit.util';
import { Code } from 'src/common/enum/code.enum';
import { COMMON_MESSAGES } from 'src/common/messages/common.messages';
import { ITEMS_LIMITS } from 'src/items/constants/items.constants';
import { Item } from 'src/items/entities/item.entity';
import { AccountStatus } from 'src/users/enums/account-status.enum';
import { USER_MESSAGES } from 'src/users/messages/user.messages';

describe('Gql - filterItems', () => {
    beforeAll(async () => {
        // simulates existing data
        const initialItemCount = 3;
        const { id: creatorId } = await createAccount({ status: AccountStatus.ACTIVE });
        for (let i = 0; i < initialItemCount; i++) {
            await createItem(creatorId);
        }
    });

    describe('"createdBy" provided', () => {
        test('return only the items created by the specified user', async () => {
            // create 5 items by the same user
            const itemsCount = 5;
            const itemsCreatedIds: string[] = [];
            const { id: creatorId } = await createAccount({ status: AccountStatus.ACTIVE });
            for (let i = 0; i < itemsCount; i++) {
                const { id: itemId } = await createItem(creatorId);
                itemsCreatedIds.push(itemId);
            }
            // filter
            const response = await testKit.gqlClient.expect(success).send({
                query: `query FilterItems($limit: Int!, $createdBy: ID) {
                          filterItems(limit: $limit, createdBy: $createdBy) {
                            nodes {
                              id
                            }
                            totalCount
                            hasNextPage
                          }
                        }`,
                variables: {
                    limit: 100,
                    createdBy: creatorId,
                },
            });
            const totalCount = response.body.data.filterItems.totalCount;
            expect(totalCount).toBe(itemsCount);
            const nodes = response.body.data.filterItems.nodes as Item[];
            expect(nodes.length).toBe(itemsCount);
            const nodesIds = nodes.map((n) => n.id);
            itemsCreatedIds.forEach((id) => {
                expect(nodesIds).toContain(id);
            });
        });
    });

    describe('"category" provided', () => {
        test('return only the items in the specified category', async () => {
            const category = 'unique-test-category';
            const itemsCount = 4;
            const itemsCreatedIds: string[] = [];
            const { id: creatorId } = await createAccount({ status: AccountStatus.ACTIVE });
            for (let i = 0; i < itemsCount; i++) {
                const item = await testKit.itemRepos.save({
                    ...testKit.itemSeed.itemInput,
                    category,
                    createdBy: creatorId,
                });
                itemsCreatedIds.push(item.id);
            }
            // filter
            const response = await testKit.gqlClient.expect(success).send({
                query: `query FilterItems($limit: Int!, $category: String) {
                          filterItems(limit: $limit, category: $category) {
                            nodes {
                              id
                              category
                            }
                            totalCount
                            hasNextPage
                          }
                        }`,
                variables: {
                    limit: 100,
                    category,
                },
            });
            const totalCount = response.body.data.filterItems.totalCount;
            expect(totalCount).toBe(itemsCount);
            const nodes = response.body.data.filterItems.nodes as Item[];
            expect(nodes.length).toBe(itemsCount);
            nodes.forEach((node) => {
                expect(node.category).toBe(category);
            });
            const nodesIds = nodes.map((n) => n.id);
            itemsCreatedIds.forEach((id) => {
                expect(nodesIds).toContain(id);
            });
        });
    });

    describe('"tag" provided', () => {
        test('return only the items containing the specified tag', async () => {
            const tag = 'unique-test-tag';
            const itemsCount = 3;
            const itemsCreatedIds: string[] = [];
            const { id: creatorId } = await createAccount({ status: AccountStatus.ACTIVE });
            for (let i = 0; i < itemsCount; i++) {
                const item = await testKit.itemRepos.save({
                    ...testKit.itemSeed.itemInput,
                    tags: [tag, 'other-tag'],
                    createdBy: creatorId,
                });
                itemsCreatedIds.push(item.id);
            }
            // filter
            const response = await testKit.gqlClient.expect(success).send({
                query: `query FilterItems($limit: Int!, $tag: String) {
                          filterItems(limit: $limit, tag: $tag) {
                            nodes {
                              id
                              tags
                            }
                            totalCount
                            hasNextPage
                          }
                        }`,
                variables: {
                    limit: 100,
                    tag,
                },
            });
            const totalCount = response.body.data.filterItems.totalCount;
            expect(totalCount).toBe(itemsCount);
            const nodes = response.body.data.filterItems.nodes as Item[];
            expect(nodes.length).toBe(itemsCount);
            nodes.forEach((node) => {
                expect(node.tags).toContain(tag);
            });
            const nodesIds = nodes.map((n) => n.id);
            itemsCreatedIds.forEach((id) => {
                expect(nodesIds).toContain(id);
            });
        });
    });

    describe('"createdBy" and "category" provided', () => {
        test('return only the items created by the user in the specified category', async () => {
            const category = 'combined-filter-category';
            const { id: creatorId } = await createAccount({ status: AccountStatus.ACTIVE });
            // Create items by the user in the category
            const itemsCount = 2;
            const itemsCreatedIds: string[] = [];
            for (let i = 0; i < itemsCount; i++) {
                const item = await testKit.itemRepos.save({
                    ...testKit.itemSeed.itemInput,
                    category,
                    createdBy: creatorId,
                });
                itemsCreatedIds.push(item.id);
            }
            // Create item by the user in different category (should not be returned)
            await testKit.itemRepos.save({
                ...testKit.itemSeed.itemInput,
                category: 'other-category',
                createdBy: creatorId,
            });
            // Create item by different user in the same category (should not be returned)
            const { id: otherCreatorId } = await createAccount({ status: AccountStatus.ACTIVE });
            await testKit.itemRepos.save({
                ...testKit.itemSeed.itemInput,
                category,
                createdBy: otherCreatorId,
            });
            // filter
            const response = await testKit.gqlClient.expect(success).send({
                query: `query FilterItems($limit: Int!, $createdBy: ID, $category: String) {
                          filterItems(limit: $limit, createdBy: $createdBy, category: $category) {
                            nodes {
                              id
                              category
                              createdBy
                            }
                            totalCount
                            hasNextPage
                          }
                        }`,
                variables: {
                    limit: 100,
                    createdBy: creatorId,
                    category,
                },
            });
            const totalCount = response.body.data.filterItems.totalCount;
            expect(totalCount).toBe(itemsCount);
            const nodes = response.body.data.filterItems.nodes as Item[];
            expect(nodes.length).toBe(itemsCount);
            nodes.forEach((node) => {
                expect(node.category).toBe(category);
                expect(node.createdBy).toBe(creatorId);
            });
            const nodesIds = nodes.map((n) => n.id);
            itemsCreatedIds.forEach((id) => {
                expect(nodesIds).toContain(id);
            });
        });
    });

    describe('"createdBy", "category" and "tag" provided', () => {
        test('return only the items matching all filters', async () => {
            const category = 'all-filters-category';
            const tag = 'all-filters-tag';
            const { id: creatorId } = await createAccount({ status: AccountStatus.ACTIVE });
            // Create item matching all filters
            const item = await testKit.itemRepos.save({
                ...testKit.itemSeed.itemInput,
                category,
                tags: [tag, 'another-tag'],
                createdBy: creatorId,
            });
            // Create item by same user, same category, different tag (should not be returned)
            await testKit.itemRepos.save({
                ...testKit.itemSeed.itemInput,
                category,
                tags: ['different-tag'],
                createdBy: creatorId,
            });
            // filter
            const response = await testKit.gqlClient.expect(success).send({
                query: `query FilterItems($limit: Int!, $createdBy: ID, $category: String, $tag: String) {
                          filterItems(limit: $limit, createdBy: $createdBy, category: $category, tag: $tag) {
                            nodes {
                              id
                            }
                            totalCount
                            hasNextPage
                          }
                        }`,
                variables: {
                    limit: 100,
                    createdBy: creatorId,
                    category,
                    tag,
                },
            });
            const totalCount = response.body.data.filterItems.totalCount;
            expect(totalCount).toBe(1);
            const nodes = response.body.data.filterItems.nodes as Item[];
            expect(nodes.length).toBe(1);
            expect(nodes[0].id).toBe(item.id);
        });
    });

    describe('No filters provided', () => {
        test('return all the items in database', async () => {
            const allInDbCount = await testKit.itemRepos.count();
            const response = await testKit.gqlClient.expect(success).send({
                query: `query FilterItems($limit: Int!) {
                          filterItems(limit: $limit) {
                            nodes {
                              id
                            }
                            totalCount
                            hasNextPage
                          }
                        }`,
                variables: {
                    limit: 100,
                },
            });
            const totalCount = response.body.data.filterItems.totalCount;
            expect(totalCount).toBe(allInDbCount);
            const nodes = response.body.data.filterItems.nodes as Item[];
            expect(nodes.length).toBe(allInDbCount);
        });
    });

    describe('Invalid createdBy id', () => {
        test('return not found code and user not found error message', async () => {
            const invalidUserId = 'invalidUserUUid12345_';
            const response = await testKit.gqlClient.send({
                query: `query FilterItems($limit: Int!, $createdBy: ID) {
                          filterItems(limit: $limit, createdBy: $createdBy) {
                            nodes {
                              id
                            }
                            totalCount
                            hasNextPage
                          }
                        }`,
                variables: {
                    limit: 100,
                    createdBy: invalidUserId,
                },
            });
            expect(response).toFailWith(Code.NOT_FOUND, USER_MESSAGES.NOT_FOUND);
        });
    });

    describe('Invalid category length', () => {
        test('return bad request code and invalid input error message', async () => {
            const invalidCategory = faker.string.alpha({ length: ITEMS_LIMITS.CATEGORY.MAX + 1 });
            const response = await testKit.gqlClient.send({
                query: `query FilterItems($limit: Int!, $category: String) {
                          filterItems(limit: $limit, category: $category) {
                            nodes {
                              id
                            }
                            totalCount
                            hasNextPage
                          }
                        }`,
                variables: {
                    limit: 100,
                    category: invalidCategory,
                },
            });
            expect(response).toFailWith(Code.BAD_REQUEST, COMMON_MESSAGES.INVALID_INPUT);
        });
    });

    describe('Invalid tag length', () => {
        test('return bad request code and invalid input error message', async () => {
            const invalidTag = faker.string.alpha({ length: ITEMS_LIMITS.TAGS.TAG_MAX_LENGTH + 1 });
            const response = await testKit.gqlClient.send({
                query: `query FilterItems($limit: Int!, $tag: String) {
                          filterItems(limit: $limit, tag: $tag) {
                            nodes {
                              id
                            }
                            totalCount
                            hasNextPage
                          }
                        }`,
                variables: {
                    limit: 100,
                    tag: invalidTag,
                },
            });
            expect(response).toFailWith(Code.BAD_REQUEST, COMMON_MESSAGES.INVALID_INPUT);
        });
    });
});
